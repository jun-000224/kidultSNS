// server/routes/feed.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const authMiddleware = require("../auth");
const multer = require("multer");
const path = require("path");

// 업로드 폴더
const uploadDir = path.join(__dirname, "..", "uploads");

// multer 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + "-" + file.originalname;
        cb(null, uniqueName);
    },
});

// 한 요청당 파일 최대 5장 제한
const upload = multer({
    storage,
    limits: { files: 5 },
});

// 공통: SELECT 결과를 피드 리스트로 묶어주는 함수
function buildFeedList(rows) {
    const map = new Map();

    rows.forEach((row) => {
        if (!map.has(row.feedId)) {
            map.set(row.feedId, {
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
                bookmarkCount: row.bookmarkCount || 0,
                bookmarked: row.bookmarked === 1,
                imgPath: null,
                imgName: null,
                images: [],
                // 태그 점수용 필드 (초기값 0)
                tagScore: 0,
            });
        }

        const feed = map.get(row.feedId);

        if (row.imgId) {
            feed.images.push({
                imgId: row.imgId,
                imgName: row.imgName,
                imgPath: row.imgPath,
            });

            // 대표 이미지 1장
            if (!feed.imgPath) {
                feed.imgPath = row.imgPath;
                feed.imgName = row.imgName;
            }
        }
    });

    return Array.from(map.values());
}

// 해시태그 문자열을 태그 배열로 변환하는 함수
// "#포켓몬 #건프라 #피규어" → ["포켓몬", "건프라", "피규어"]
function parseTags(hashString) {
    if (!hashString) return [];

    return hashString
        .split("#")
        .map((t) => t.replace(/[\s\r\n]+/g, " ").trim())
        .filter((t) => t.length > 0);
}

// 특정 유저가 특정 피드의 태그에 대해 점수를 증감시키는 함수
// delta 는 증가 또는 감소 값
async function updateUserTagScoreByFeed(userId, feedId, delta) {
    try {
        // 피드의 해시태그 가져오기
        const [feedRows] = await db.query(
            "SELECT hash FROM tbl_feed WHERE feedId = ?",
            [feedId]
        );

        if (!feedRows || feedRows.length === 0) {
            return;
        }

        const hash = feedRows[0].hash;
        const tags = parseTags(hash);

        if (!tags || tags.length === 0) {
            return;
        }

        // 각 태그에 대해 점수 upsert
        // score 컬럼 기준, 음수가 되지 않도록 처리
        for (const tag of tags) {
            await db.query(
                "INSERT INTO tbl_user_tag_score (userId, tag, score) " +
                "VALUES (?, ?, ?) " +
                "ON DUPLICATE KEY UPDATE " +
                "  score = CASE WHEN score + VALUES(score) < 0 THEN 0 ELSE score + VALUES(score) END",
                [userId, tag, delta]
            );
        }
    } catch (err) {
        // 점수 적립 실패해도 메인 로직은 계속 진행
        console.log("updateUserTagScoreByFeed error:", err);
    }
}

/**
 * 1) 전체 피드 목록 (알고리즘 정렬된 타임라인)
 *  - URL: GET /feed/feedAll
 */
router.get("/feedAll", authMiddleware, async (req, res) => {
    const loginUserId = req.user.userId;

    try {
        const sql =
            "SELECT F.*, " +
            "       I.imgId, I.imgName, I.imgPath, " +
            "       U.userName, " +
            "       IFNULL(L.cntLike, 0) AS likeCount, " +
            "       IFNULL(UL.liked, 0) AS liked, " +
            "       IFNULL(B.cntBookmark, 0) AS bookmarkCount, " +
            "       IFNULL(UB.bookmarked, 0) AS bookmarked " +
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
            "LEFT JOIN ( " +
            "   SELECT feedId, COUNT(*) AS cntBookmark " +
            "   FROM tbl_feed_bookmark " +
            "   GROUP BY feedId " +
            ") B ON F.feedId = B.feedId " +
            "LEFT JOIN ( " +
            "   SELECT feedId, 1 AS bookmarked " +
            "   FROM tbl_feed_bookmark " +
            "   WHERE userId = ? " +
            ") UB ON F.feedId = UB.feedId " +
            "ORDER BY F.cdatetime DESC";

        const [rows] = await db.query(sql, [loginUserId, loginUserId]);
        const list = buildFeedList(rows);

        // 로그인 유저의 태그 점수 조회
        let tagScoreMap = new Map();
        try {
            const [tagRows] = await db.query(
                "SELECT tag, score FROM tbl_user_tag_score WHERE userId = ?",
                [loginUserId]
            );
            tagRows.forEach((r) => {
                tagScoreMap.set(r.tag, r.score || 0);
            });
        } catch (tagErr) {
            console.log("tag score select error(feedAll):", tagErr);
        }

        // 각 피드별 태그 점수 계산
        list.forEach((feed) => {
            const tags = parseTags(feed.hash);
            let total = 0;

            tags.forEach((t) => {
                const s = tagScoreMap.get(t);
                if (typeof s === "number" && s > 0) {
                    total += s;
                }
            });

            feed.tagScore = total;
        });

        // tagScore 기준 내림차순, 동점일 때는 최신순
        list.sort((a, b) => {
            if (b.tagScore !== a.tagScore) {
                return b.tagScore - a.tagScore;
            }
            const aTime = a.cdatetime ? new Date(a.cdatetime).getTime() : 0;
            const bTime = b.cdatetime ? new Date(b.cdatetime).getTime() : 0;
            return bTime - aTime;
        });

        res.json({ result: "success", list });
    } catch (err) {
        console.log("feedAll error:", err);
        res.status(500).json({ result: "fail", message: "feedAll error" });
    }
});

/**
 * 2) 피드 검색
 *  - URL: POST /feed/search
 */
router.post("/search", authMiddleware, async (req, res) => {
    const loginUserId = req.user.userId;
    const { search } = req.body;

    try {
        const sql =
            "SELECT F.*, " +
            "       I.imgId, I.imgName, I.imgPath, " +
            "       U.userName, " +
            "       IFNULL(L.cntLike, 0) AS likeCount, " +
            "       IFNULL(UL.liked, 0) AS liked, " +
            "       IFNULL(B.cntBookmark, 0) AS bookmarkCount, " +
            "       IFNULL(UB.bookmarked, 0) AS bookmarked " +
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
            "LEFT JOIN ( " +
            "   SELECT feedId, COUNT(*) AS cntBookmark " +
            "   FROM tbl_feed_bookmark " +
            "   GROUP BY feedId " +
            ") B ON F.feedId = B.feedId " +
            "LEFT JOIN ( " +
            "   SELECT feedId, 1 AS bookmarked " +
            "   FROM tbl_feed_bookmark " +
            "   WHERE userId = ? " +
            ") UB ON F.feedId = UB.feedId " +
            "WHERE (F.title   LIKE CONCAT('%', ?, '%') " +
            "   OR F.content LIKE CONCAT('%', ?, '%') " +
            "   OR F.hash    LIKE CONCAT('%', ?, '%')) " +
            "ORDER BY F.cdatetime DESC";

        const [rows] = await db.query(sql, [
            loginUserId,
            loginUserId,
            search,
            search,
            search,
        ]);

        const list = buildFeedList(rows);
        res.json({ result: "success", list });
    } catch (err) {
        console.log("search error:", err);
        res.status(500).json({ result: "fail", message: "search error" });
    }
});

/**
 * 3) 내 북마크 피드 목록
 *  - URL: GET /feed/bookmarks
 */
router.get("/bookmarks", authMiddleware, async (req, res) => {
    const loginUserId = req.user.userId;

    try {
        const sql =
            "SELECT F.*, " +
            "       I.imgId, I.imgName, I.imgPath, " +
            "       U.userName, " +
            "       IFNULL(L.cntLike, 0) AS likeCount, " +
            "       IFNULL(UL.liked, 0) AS liked, " +
            "       IFNULL(B.cntBookmark, 0) AS bookmarkCount, " +
            "       1 AS bookmarked " +
            "FROM tbl_feed_bookmark BK " +
            "JOIN tbl_feed F ON BK.feedId = F.feedId " +
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
            "LEFT JOIN ( " +
            "   SELECT feedId, COUNT(*) AS cntBookmark " +
            "   FROM tbl_feed_bookmark " +
            "   GROUP BY feedId " +
            ") B ON F.feedId = B.feedId " +
            "WHERE BK.userId = ? " +
            "ORDER BY BK.cdatetime DESC";

        const [rows] = await db.query(sql, [loginUserId, loginUserId]);
        const list = buildFeedList(rows);

        res.json({ result: "success", list });
    } catch (err) {
        console.log("bookmark list error:", err);
        res.status(500).json({ result: "fail", message: "bookmark list error" });
    }
});

/**
 * 4) 피드 등록 (텍스트만)
 *  - URL: POST /feed
 */
router.post("/", async (req, res) => {
    const { userId, title, content, hash } = req.body;

    try {
        const sql =
            "INSERT INTO tbl_feed (userId, title, content, feedType, hash) " +
            "VALUES (?, ?, ?, 'NORMAL', ?)";

        const [result] = await db.query(sql, [userId, title, content, hash]);
        const feedId = result.insertId;

        // 작성자의 태그 점수도 약하게 반영
        try {
            await updateUserTagScoreByFeed(userId, feedId, 1);
        } catch (innerErr) {
            console.log("tag score update error(write text):", innerErr);
        }

        res.json({ result: "success", feedId, msg: "success" });
    } catch (err) {
        console.log("feed insert error:", err);
        res.status(500).json({ result: "fail" });
    }
});

/**
 * 5) 피드 등록 (텍스트 + 이미지 최대 5장)
 *  - URL: POST /feed/write
 */
router.post("/write", upload.array("file", 5), async (req, res) => {
    const { userId, title, content, hash } = req.body;
    const files = req.files || [];

    try {
        // 1. 피드 저장
        const sql =
            "INSERT INTO tbl_feed (userId, title, content, feedType, hash) " +
            "VALUES (?, ?, ?, 'NORMAL', ?)";
        const [feedResult] = await db.query(sql, [userId, title, content, hash]);
        const feedId = feedResult.insertId;

        // 2. 이미지 저장
        const imgResults = [];
        for (const file of files) {
            const filename = file.filename;
            const imgPath = "/uploads/" + filename;

            const q =
                "INSERT INTO tbl_feed_img (feedId, imgName, imgPath) " +
                "VALUES (?, ?, ?)";
            const [r] = await db.query(q, [feedId, filename, imgPath]);
            imgResults.push(r);
        }

        // 작성자의 태그 점수도 약하게 반영
        try {
            await updateUserTagScoreByFeed(userId, feedId, 1);
        } catch (innerErr) {
            console.log("tag score update error(write):", innerErr);
        }

        res.json({
            result: "success",
            feedId,
            imgResult: imgResults,
            msg: "등록되었습니다.",
        });
    } catch (err) {
        console.log("feed write error:", err);
        res.status(500).json({ result: "fail" });
    }
});

/**
 * 6) 이미지 추가 업로드 (기존 피드에)
 *  - URL: POST /feed/upload
 */
router.post("/upload", upload.array("file", 5), async (req, res) => {
    const { feedId } = req.body;
    const files = req.files || [];

    if (!feedId || files.length === 0) {
        return res.status(400).json({ msg: "feedId 또는 파일이 없습니다." });
    }

    try {
        const results = [];
        for (const file of files) {
            const filename = file.filename;
            const imgPath = "/uploads/" + filename;

            const q =
                "INSERT INTO tbl_feed_img (feedId, imgName, imgPath) " +
                "VALUES (?, ?, ?)";
            const [r] = await db.query(q, [feedId, filename, imgPath]);
            results.push(r);
        }

        res.json({ message: "success", result: results });
    } catch (err) {
        console.log("upload error:", err);
        res.status(500).json({ msg: "fail" });
    }
});

/**
 * 7) 피드 수정
 *  - URL: PUT /feed/:feedId
 */
router.put("/:feedId", authMiddleware, async (req, res) => {
    const { feedId } = req.params;
    const { title, content } = req.body;

    try {
        const sql =
            "UPDATE tbl_feed SET title = ?, content = ?, udatetime = NOW() " +
            "WHERE feedId = ?";
        const [result] = await db.query(sql, [title, content, feedId]);

        res.json({ result: "success", dbResult: result, msg: "수정 완료" });
    } catch (err) {
        console.log("update error:", err);
        res.status(500).json({ result: "fail" });
    }
});

/**
 * 8) 피드 삭제
 *  - URL: DELETE /feed/:feedId
 */
router.delete("/:feedId", authMiddleware, async (req, res) => {
    const { feedId } = req.params;

    try {
        const sql = "DELETE FROM tbl_feed WHERE feedId = ?";
        await db.query(sql, [feedId]);

        res.json({ result: "success", msg: "삭제 완료" });
    } catch (err) {
        console.log("delete error:", err);
        res.status(500).json({ result: "fail" });
    }
});

/**
 * 9) 좋아요 토글
 *  - URL: POST /feed/:feedId/like
 *  - 좋아요 ON 시 태그 점수 +3, OFF 시 -3
 *  - 좋아요 ON 시 알림 생성
 */
router.post("/:feedId/like", authMiddleware, async (req, res) => {
    const { feedId } = req.params;
    const userId = req.user.userId;

    try {
        // 이미 좋아요 했는지 확인
        const [rows] = await db.query(
            "SELECT * FROM tbl_feed_like WHERE feedId = ? AND userId = ?",
            [feedId, userId]
        );

        let liked;

        if (rows.length > 0) {
            // 있으면 삭제
            await db.query(
                "DELETE FROM tbl_feed_like WHERE feedId = ? AND userId = ?",
                [feedId, userId]
            );
            liked = false;
        } else {
            // 없으면 추가
            await db.query(
                "INSERT INTO tbl_feed_like (feedId, userId) VALUES (?, ?)",
                [feedId, userId]
            );
            liked = true;

            // 좋아요 알림 생성 (본인 글이 아닐 때만)
            try {
                const [feedRows] = await db.query(
                    "SELECT userId FROM tbl_feed WHERE feedId = ?",
                    [feedId]
                );

                if (feedRows.length > 0) {
                    const ownerId = feedRows[0].userId;

                    if (ownerId !== userId) {
                        await db.query(
                            "INSERT INTO tbl_notification " +
                            "  (receiverId, senderId, type, feedId, isRead) " +
                            "VALUES (?, ?, 'LIKE', ?, 0)",
                            [ownerId, userId, feedId]
                        );
                    }
                }
            } catch (notiErr) {
                console.log("like notification insert error:", notiErr);
            }
        }

        // 태그 점수 반영
        try {
            const delta = liked ? 3 : -3;
            await updateUserTagScoreByFeed(userId, feedId, delta);
        } catch (innerErr) {
            console.log("tag score update error(like):", innerErr);
        }

        // 최신 좋아요 수
        const [cntRows] = await db.query(
            "SELECT COUNT(*) AS likeCount FROM tbl_feed_like WHERE feedId = ?",
            [feedId]
        );
        const likeCount = cntRows[0]?.likeCount || 0;

        res.json({ result: "success", liked, likeCount });
    } catch (err) {
        console.log("like toggle error:", err);
        res.status(500).json({ result: "fail" });
    }
});

/**
 * 10) 북마크 토글
 *  - URL: POST /feed/:feedId/bookmark
 */
router.post("/:feedId/bookmark", authMiddleware, async (req, res) => {
    const { feedId } = req.params;
    const userId = req.user.userId;

    try {
        // 이미 북마크 했는지 확인
        const [rows] = await db.query(
            "SELECT * FROM tbl_feed_bookmark WHERE feedId = ? AND userId = ?",
            [feedId, userId]
        );

        let bookmarked;

        if (rows.length > 0) {
            // 있으면 삭제
            await db.query(
                "DELETE FROM tbl_feed_bookmark WHERE feedId = ? AND userId = ?",
                [feedId, userId]
            );
            bookmarked = false;
        } else {
            // 없으면 추가
            await db.query(
                "INSERT INTO tbl_feed_bookmark (feedId, userId) VALUES (?, ?)",
                [feedId, userId]
            );
            bookmarked = true;
        }

        // 태그 점수 반영
        try {
            const delta = bookmarked ? 5 : -5;
            await updateUserTagScoreByFeed(userId, feedId, delta);
        } catch (innerErr) {
            console.log("tag score update error(bookmark):", innerErr);
        }

        res.json({ result: "success", bookmarked });
    } catch (err) {
        console.log("bookmark toggle error:", err);
        res.status(500).json({ result: "fail" });
    }
});

// 내가 북마크한 피드 목록 조회
router.get("/bookmark/list", authMiddleware, async (req, res) => {
    const userId = req.user.userId;

    try {
        const sql =
            "SELECT F.*, I.imgId, I.imgName, I.imgPath, U.userName " +
            "FROM tbl_feed_bookmark B " +
            "JOIN tbl_feed F ON B.feedId = F.feedId " +
            "LEFT JOIN tbl_feed_img I ON F.feedId = I.feedId " +
            "JOIN tbl_user U ON F.userId = U.userId " +
            "WHERE B.userId = ? " +
            "ORDER BY B.cdatetime DESC";

        const [rows] = await db.query(sql, [userId]);

        let feedMap = new Map();

        rows.forEach(row => {
            if (!feedMap.has(row.feedId)) {
                feedMap.set(row.feedId, {
                    feedId: row.feedId,
                    userId: row.userId,
                    userName: row.userName,
                    title: row.title,
                    content: row.content,
                    hash: row.hash,
                    cdatetime: row.cdatetime,
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
            result: "success",
            list
        });

    } catch (error) {
        console.log("bookmark list error:", error);
        res.status(500).json({ result: "fail" });
    }
});

module.exports = router;
