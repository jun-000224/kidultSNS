// server/routes/feed.js
const express = require('express');
const router = express.Router();
const db = require("../db");
const authMiddleware = require("../auth");
const multer = require('multer');
const path = require('path');

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

// 피드 목록 조회 (유저별)
router.get("/:userId", async (req, res) => {
    let { userId } = req.params;

    try {
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
            "WHERE F.userId = ? " +
            "ORDER BY F.cdatetime DESC";

        // 첫 번째 ? -> UL 서브쿼리의 userId (현재 로그인 유저)
        // 두 번째 ? -> F.userId 조건 (지금은 자기 글 기준 조회)
        let [rows] = await db.query(sql, [userId, userId]);

        // feedMap을 Map으로 사용하여 한 피드에 여러 이미지 매핑
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
                    hash: row.hash,                        // 해시태그
                    likeCount: row.likeCount || 0,         // 좋아요 개수
                    liked: row.liked === 1,                // boolean 으로 변환
                    imgPath: null,
                    imgName: null,
                    images: []
                });
            }

            let feedData = feedMap.get(row.feedId);

            // 이미지가 있는 경우 이미지 목록에 추가
            if (row.imgId) {
                feedData.images.push({
                    imgId: row.imgId,
                    imgName: row.imgName,
                    imgPath: row.imgPath
                });

                // 대표 이미지가 아직 없으면 첫 번째 이미지를 대표로 사용
                if (!feedData.imgPath) {
                    feedData.imgPath = row.imgPath;
                    feedData.imgName = row.imgName;
                }
            }
        });

        // Map → Array 변환
        let list = Array.from(feedMap.values());

        res.json({
            list,
            result: "success"
        });

    } catch (error) {
        console.log("feed list error:", error);
        res.status(500).json({ result: "fail" });
    }
});

// 피드 등록 (텍스트만 등록할 때 사용)
router.post("/", async (req, res) => {
    let { userId, title, content, hash } = req.body;

    try {
        let sql = `
            INSERT INTO tbl_feed (userId, title, content, feedType, hash)
            VALUES (?, ?, ?, 'NORMAL', ?)
        `;

        let [result] = await db.query(sql, [userId, title, content, hash]);

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

// 피드 등록 (텍스트 + 이미지 한 번에, 최대 5장)
// form-data 예시
//  userId: 222
//  title: 제목
//  content: 내용
//  hash: #태그1 #태그2 ...
//  file: 이미지1
//  file: 이미지2 ...
router.post("/write", upload.array('file', 5), async (req, res) => {
    let { userId, title, content, hash } = req.body;
    const files = req.files || [];

    try {
        // 1. 피드 먼저 저장
        let sql = `
            INSERT INTO tbl_feed (userId, title, content, feedType, hash)
            VALUES (?, ?, ?, 'NORMAL', ?)
        `;
        let [feedResult] = await db.query(sql, [userId, title, content, hash]);
        const feedId = feedResult.insertId;

        // 2. 이미지가 있으면 이미지 테이블에 저장
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

// 피드 수정 (제목, 내용만 수정)
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

    // 토큰에서 꺼낸 로그인 유저 정보
    const userId = req.user.userId;

    try {
        // 1. 이미 좋아요를 눌렀는지 확인
        let [rows] = await db.query(
            "SELECT * FROM tbl_feed_like WHERE feedId = ? AND userId = ?",
            [feedId, userId]
        );

        let liked;

        if (rows.length > 0) {
            // 이미 눌렀으면 좋아요 취소
            await db.query(
                "DELETE FROM tbl_feed_like WHERE feedId = ? AND userId = ?",
                [feedId, userId]
            );
            liked = false;
        } else {
            // 안 눌렀으면 좋아요 추가
            await db.query(
                "INSERT INTO tbl_feed_like (feedId, userId) VALUES (?, ?)",
                [feedId, userId]
            );
            liked = true;
        }

        // 2. 최신 좋아요 개수 다시 조회
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
