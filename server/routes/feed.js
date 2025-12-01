// server/routes/feed.js
const express = require('express');
const router = express.Router();
const db = require("../db");
const authMiddleware = require("../auth");
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'server_secret_key';

// 업로드 폴더
const uploadDir = path.join(__dirname, '..', 'uploads');

// multer 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + "-" + file.originalname;
        cb(null, uniqueName);
    }
});

// 한 요청당 파일 최대 5장으로 제한
const upload = multer({
    storage,
    limits: { files: 5 }
});

// -----------------------------
// 해시태그 / 태그 점수 관련 헬퍼
// -----------------------------

// 해시태그 문자열에서 태그 배열 뽑기
function extractTagsFromHash(hashStr) {
    if (!hashStr) return [];
    // 공백 / 쉼표 / # / + 기준으로 쪼개고 소문자로 정리
    return hashStr
        .split(/[\s,#+]+/g)
        .map(t => t.trim().toLowerCase())
        .filter(t => t.length > 0);
}

// 유저의 태그 점수를 누적시키는 함수
async function addUserTagScore(userId, hashStr, weight) {
    if (!userId || !hashStr) return;

    const tags = extractTagsFromHash(hashStr);
    if (tags.length === 0) return;

    const values = tags.map(() => "(?, ?, ?)").join(",");
    const params = [];
    tags.forEach(tag => {
        params.push(userId, tag, weight);
    });

    const sql = `
        INSERT INTO tbl_user_tag_score (userId, tag, score)
        VALUES ${values}
        ON DUPLICATE KEY UPDATE score = score + VALUES(score)
    `;
    await db.query(sql, params);
}

// -----------------------------
// 요청 헤더에서 토큰 파싱해서 userId 뽑아내는 헬퍼
// -----------------------------
function getLoginUserId(req) {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.split(' ')[1];

    if (!token) return null;

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded.userId;
    } catch (e) {
        console.log('token decode error in feed route:', e.message);
        return null;
    }
}

/**
 * 피드 목록 조회 (전체 타임라인 + 알고리즘 정렬)
 * - 실제 URL: /feed/feedAll
 * - 로그인 안되어 있어도 동작하지만,
 *   로그인되어 있으면 태그 성향 + 팔로우 + 좋아요 기반으로 정렬
 */
router.get("/feedAll", async (req, res) => {
    const loginUserId = getLoginUserId(req); // 없으면 null

    try {
        // 1) 기본 피드 + 이미지 + 좋아요 수 + 내가 좋아요 눌렀는지
        let sql =
            "SELECT F.*, " +
            "       I.imgId, I.imgName, I.imgPath, " +
            "       U.userName, " +
            "       IFNULL(L.cntLike, 0) AS likeCount, " +   // 좋아요 개수
            "       IFNULL(UL.liked, 0) AS liked " +        // 내가 누른 여부(0/1)
            "FROM tbl_feed F " +
            "LEFT JOIN tbl_feed_img I ON F.feedId = I.feedId " +
            "JOIN tbl_user U ON F.userId = U.userId " +
            "LEFT JOIN ( " +
            "   SELECT feedId, COUNT(*) AS cntLike " +
            "   FROM tbl_feed_like " +
            "   GROUP BY feedId " +
            ") L ON F.feedId = L.feedId " +
            "LEFT JOIN ( " +
            "   SELECT feedId, 1 AS liked " +
            "   FROM tbl_feed_like " +
            "   WHERE userId = ? " +
            ") UL ON F.feedId = UL.feedId " +
            "ORDER BY F.cdatetime DESC";

        let [rows] = await db.query(sql, [loginUserId || '']);

        // 2) feedId 기준으로 이미지 합치기
        let feedMap = new Map();

        rows.forEach(row => {
            if (!feedMap.has(row.feedId)) {
                feedMap.set(row.feedId, {
                    feedId: row.feedId,
                    userId: row.userId,
                    userName: row.userName,
                    title: row.title,
                    content: row.content,
                    feedType: row.feedType,
                    viewCnt: row.viewCnt,
                    cdatetime: row.cdatetime,
                    udatetime: row.udatetime,
                    hash: row.hash,
                    likeCount: row.likeCount || 0,
                    liked: row.liked === 1,   // 0/1 → boolean
                    imgPath: null,
                    imgName: null,
                    images: [],
                    _score: 0,
                    _recency: 0
                });
            }

            const feedData = feedMap.get(row.feedId);

            if (row.imgId) {
                feedData.images.push({
                    imgId: row.imgId,
                    imgName: row.imgName,
                    imgPath: row.imgPath
                });

                if (!feedData.imgPath) {
                    feedData.imgPath = row.imgPath;
                    feedData.imgName = row.imgName;
                }
            }
        });

        let list = Array.from(feedMap.values());

        // 로그인 안 되어 있으면 그냥 최신순 그대로 리턴
        if (!loginUserId) {
            return res.json({
                list,
                result: "success"
            });
        }

        // 3) 로그인된 경우 → 내 태그 점수 / 팔로우 목록 불러오기

        // 3-1) 내 태그 점수
        let [tagRows] = await db.query(
            "SELECT tag, score FROM tbl_user_tag_score WHERE userId = ?",
            [loginUserId]
        );
        const tagScoreMap = {};
        tagRows.forEach(r => {
            tagScoreMap[r.tag] = r.score;
        });

        // 3-2) 내가 팔로우한 사람 목록
        let [followRows] = await db.query(
            "SELECT followingId FROM tbl_follow WHERE followerId = ?",
            [loginUserId]
        );
        const followingSet = new Set(followRows.map(r => r.followingId));

        // 4) 각 피드에 대해 점수 계산
        list.forEach(feed => {
            const tags = extractTagsFromHash(feed.hash);
            let interestScore = 0;

            tags.forEach(t => {
                interestScore += tagScoreMap[t] || 0;
            });

            const socialScore = followingSet.has(feed.userId) ? 10 : 0;
            const likeScore = feed.likeCount || 0;

            const baseScore =
                interestScore * 2 + // 취향 태그
                socialScore * 3 +   // 팔로우한 유저의 글이면 강하게 가산
                likeScore * 1;      // 좋아요 수

            feed._score = baseScore;

            // 최신 글 우선 정렬을 위해 timestamp 저장
            const time = feed.cdatetime
                ? new Date(feed.cdatetime).getTime()
                : 0;
            feed._recency = time;
        });

        // 5) 점수순 → 같은 점수면 최신순 정렬
        list.sort((a, b) => {
            if (b._score !== a._score) return b._score - a._score;
            return b._recency - a._recency;
        });

        res.json({
            list,
            result: "success"
        });

    } catch (error) {
        console.log("feed list (all) error:", error);
        res.status(500).json({ result: "fail", message: "feedAll error" });
    }
});

/**
 * 피드 검색
 * - 실제 URL: /feed/search
 * - body: { search: "검색어" }
 * - 제목, 내용, 해시태그 기준으로 검색
 * - 토큰 있으면 좋아요 여부 포함, 없어도 검색은 됨
 */
router.post("/search", async (req, res) => {
    const loginUserId = getLoginUserId(req);
    const { search } = req.body;

    try {
        let sql =
            "SELECT F.*, " +
            "       I.imgId, I.imgName, I.imgPath, " +
            "       U.userName, " +
            "       IFNULL(L.cntLike, 0) AS likeCount, " +
            "       IFNULL(UL.liked, 0) AS liked " +
            "FROM tbl_feed F " +
            "LEFT JOIN tbl_feed_img I ON F.feedId = I.feedId " +
            "JOIN tbl_user U ON F.userId = U.userId " +
            "LEFT JOIN ( " +
            "   SELECT feedId, COUNT(*) AS cntLike " +
            "   FROM tbl_feed_like " +
            "   GROUP BY feedId " +
            ") L ON F.feedId = L.feedId " +
            "LEFT JOIN ( " +
            "   SELECT feedId, 1 AS liked " +
            "   FROM tbl_feed_like " +
            "   WHERE userId = ? " +
            ") UL ON F.feedId = UL.feedId " +
            "WHERE (F.title   LIKE CONCAT('%', ?, '%') " +
            "   OR F.content LIKE CONCAT('%', ?, '%') " +
            "   OR F.hash    LIKE CONCAT('%', ?, '%')) " +
            "ORDER BY F.cdatetime DESC";

        let [rows] = await db.query(sql, [
            loginUserId || '',
            search,
            search,
            search
        ]);

        let feedMap = new Map();

        rows.forEach(row => {
            if (!feedMap.has(row.feedId)) {
                feedMap.set(row.feedId, {
                    feedId: row.feedId,
                    userId: row.userId,
                    userName: row.userName,
                    title: row.title,
                    content: row.content,
                    feedType: row.feedType,
                    viewCnt: row.viewCnt,
                    cdatetime: row.cdatetime,
                    udatetime: row.udatetime,
                    hash: row.hash,
                    likeCount: row.likeCount || 0,
                    liked: row.liked === 1,
                    imgPath: null,
                    imgName: null,
                    images: []
                });
            }

            const feedData = feedMap.get(row.feedId);

            if (row.imgId) {
                feedData.images.push({
                    imgId: row.imgId,
                    imgName: row.imgName,
                    imgPath: row.imgPath
                });

                if (!feedData.imgPath) {
                    feedData.imgPath = row.imgPath;
                    feedData.imgName = row.imgName;
                }
            }
        });

        const list = Array.from(feedMap.values());

        res.json({
            list,
            result: "success"
        });

    } catch (error) {
        console.log("feed search error:", error);
        res.status(500).json({ result: "fail", message: "search error" });
    }
});

/**
 * 피드 목록 조회 (유저별)
 * - 실제 URL: /feed/:userId
 */
router.get("/:userId", async (req, res) => {
    let { userId } = req.params;

    try {
        let sql =
            "SELECT F.*, " +
            "       I.imgId, I.imgName, I.imgPath, " +
            "       U.userName, " +
            "       IFNULL(L.cntLike, 0) AS likeCount, " +
            "       IFNULL(UL.liked, 0) AS liked " +
            "FROM tbl_feed F " +
            "LEFT JOIN tbl_feed_img I ON F.feedId = I.feedId " +
            "JOIN tbl_user U ON F.userId = U.userId " +
            "LEFT JOIN ( " +
            "   SELECT feedId, COUNT(*) AS cntLike " +
            "   FROM tbl_feed_like " +
            "   GROUP BY feedId " +
            ") L ON F.feedId = L.feedId " +
            "LEFT JOIN ( " +
            "   SELECT feedId, 1 AS liked " +
            "   FROM tbl_feed_like " +
            "   WHERE userId = ? " +
            ") UL ON F.feedId = UL.feedId " +
            "WHERE F.userId = ? " +
            "ORDER BY F.cdatetime DESC";

        // 여기서는 간단하게, 좋아요 기준 유저도 해당 userId로 둠
        let [rows] = await db.query(sql, [userId, userId]);

        let feedMap = new Map();

        rows.forEach(row => {
            if (!feedMap.has(row.feedId)) {
                feedMap.set(row.feedId, {
                    feedId: row.feedId,
                    userId: row.userId,
                    userName: row.userName,
                    title: row.title,
                    content: row.content,
                    feedType: row.feedType,
                    viewCnt: row.viewCnt,
                    cdatetime: row.cdatetime,
                    udatetime: row.udatetime,
                    hash: row.hash,
                    likeCount: row.likeCount || 0,
                    liked: row.liked === 1,
                    imgPath: null,
                    imgName: null,
                    images: []
                });
            }

            const feedData = feedMap.get(row.feedId);

            if (row.imgId) {
                feedData.images.push({
                    imgId: row.imgId,
                    imgName: row.imgName,
                    imgPath: row.imgPath
                });

                if (!feedData.imgPath) {
                    feedData.imgPath = row.imgPath;
                    feedData.imgName = row.imgName;
                }
            }
        });

        const list = Array.from(feedMap.values());

        res.json({
            list,
            result: "success"
        });

    } catch (error) {
        console.log("feed list (user) error:", error);
        res.status(500).json({ result: "fail" });
    }
});

// 피드 등록 (텍스트만)
router.post("/", async (req, res) => {
    let { userId, title, content, hash } = req.body;

    try {
        let sql = `
            INSERT INTO tbl_feed (userId, title, content, feedType, hash)
            VALUES (?, ?, ?, 'NORMAL', ?)
        `;

        let [result] = await db.query(sql, [userId, title, content, hash]);

        // 텍스트만 등록하는 경우에도 태그 점수 반영하고 싶으면 여기도 활성화
        // await addUserTagScore(userId, hash, 3);

        res.json({
            result,
            feedId: result.insertId,
            msg: "success"
        });

    } catch (error) {
        console.log("feed insert error:", error);
        res.status(500).json({ msg: "fail" });
    }
});

// 피드 등록 (텍스트 + 이미지, 최대 5장)
router.post("/write", upload.array('file', 5), async (req, res) => {
    let { userId, title, content, hash } = req.body;
    const files = req.files || [];

    try {
        // 1. 피드 저장
        let sql = `
            INSERT INTO tbl_feed (userId, title, content, feedType, hash)
            VALUES (?, ?, ?, 'NORMAL', ?)
        `;
        let [feedResult] = await db.query(sql, [userId, title, content, hash]);
        const feedId = feedResult.insertId;

        // ✅ 내 태그 성향 점수 반영 (+3)
        await addUserTagScore(userId, hash, 3);

        // 2. 이미지 저장
        let imgResults = [];

        for (let file of files) {
            let filename = file.filename;
            let imgPath = "/uploads/" + filename;

            let query = `
                INSERT INTO tbl_feed_img (feedId, imgName, imgPath)
                VALUES (?, ?, ?)
            `;
            let [result] = await db.query(query, [feedId, filename, imgPath]);
            imgResults.push(result);
        }

        res.json({
            result: "success",
            feedId: feedId,
            imgResult: imgResults,
            msg: "등록되었습니다."
        });

    } catch (error) {
        console.log("feed write error:", error);
        res.status(500).json({ msg: "fail" });
    }
});

// 파일 업로드만 따로 하는 경우
router.post('/upload', upload.array('file', 5), async (req, res) => {
    let { feedId } = req.body;
    const files = req.files;

    if (!feedId || !files || files.length === 0) {
        return res.status(400).json({ msg: "feedId 또는 파일이 없습니다." });
    }

    try {
        let results = [];

        for (let file of files) {
            let filename = file.filename;
            let imgPath = "/uploads/" + filename;

            let query = `
                INSERT INTO tbl_feed_img (feedId, imgName, imgPath)
                VALUES (?, ?, ?)
            `;

            let [result] = await db.query(query, [feedId, filename, imgPath]);
            results.push(result);
        }

        res.json({
            message: "success",
            result: results
        });

    } catch (err) {
        console.log("upload error:", err);
        res.status(500).send("Server Error");
    }
});

// 피드 수정 (제목, 내용만)
router.put("/:feedId", authMiddleware, async (req, res) => {
    let { feedId } = req.params;
    let { title, content } = req.body;

    try {
        let sql = `
            UPDATE tbl_feed
            SET title = ?, content = ?, udatetime = NOW()
            WHERE feedId = ?
        `;
        let [result] = await db.query(sql, [title, content, feedId]);

        res.json({
            result: "success",
            dbResult: result,
            msg: "수정 완료"
        });

    } catch (error) {
        console.log("update error:", error);
        res.status(500).json({ result: "fail" });
    }
});

// 피드 삭제
router.delete("/:feedId", authMiddleware, async (req, res) => {
    let { feedId } = req.params;

    try {
        let sql = "DELETE FROM tbl_feed WHERE feedId = ?";
        await db.query(sql, [feedId]);

        res.json({
            result: "success",
            msg: "삭제 완료"
        });

    } catch (error) {
        console.log("delete error:", error);
        res.status(500).json({ result: "fail" });
    }
});

// 좋아요 토글
router.post("/:feedId/like", authMiddleware, async (req, res) => {
    let { feedId } = req.params;
    const userId = req.user.userId; // 토큰에서 꺼낸 로그인 유저

    try {
        // 1. 이미 좋아요 눌렀는지 확인
        let [rows] = await db.query(
            "SELECT * FROM tbl_feed_like WHERE feedId = ? AND userId = ?",
            [feedId, userId]
        );

        let liked;

        if (rows.length > 0) {
            // 눌렀으면 취소
            await db.query(
                "DELETE FROM tbl_feed_like WHERE feedId = ? AND userId = ?",
                [feedId, userId]
            );
            liked = false;
            // 취소할 때 태그 점수까지 줄이고 싶으면 여기서 -1 처리하면 됨
        } else {
            // 안 눌렀으면 추가
            await db.query(
                "INSERT INTO tbl_feed_like (feedId, userId) VALUES (?, ?)",
                [feedId, userId]
            );
            liked = true;

            // ✅ 좋아요 누른 글의 해시태그를 내 성향에 +1
            let [feedRows] = await db.query(
                "SELECT hash FROM tbl_feed WHERE feedId = ?",
                [feedId]
            );
            if (feedRows.length > 0) {
                await addUserTagScore(userId, feedRows[0].hash, 1);
            }
        }

        // 2. 최신 좋아요 개수 조회
        let [cntRows] = await db.query(
            "SELECT COUNT(*) AS likeCount FROM tbl_feed_like WHERE feedId = ?",
            [feedId]
        );

        const likeCount = cntRows[0]?.likeCount || 0;

        res.json({
            result: "success",
            liked: liked,
            likeCount: likeCount
        });

    } catch (error) {
        console.log("like toggle error:", error);
        res.status(500).json({ result: "fail" });
    }
});

module.exports = router;
