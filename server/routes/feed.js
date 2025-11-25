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
            "SELECT F.*, I.imgId, I.imgName, I.imgPath " +
            "FROM tbl_feed F " +
            "LEFT JOIN tbl_feed_img I ON F.feedId = I.feedId " +
            "WHERE F.userId = ? " +
            "ORDER BY F.feedId DESC";

        let [rows] = await db.query(sql, [userId]);

        // 피드별로 이미지 묶기
        let feedMap = {};

        rows.forEach(row => {
            if (!feedMap[row.feedId]) {
                feedMap[row.feedId] = {
                    feedId: row.feedId,
                    userId: row.userId,
                    title: row.title,
                    content: row.content,
                    feedType: row.feedType,
                    viewCnt: row.viewCnt,
                    cdatetime: row.cdatetime,
                    udatetime: row.udatetime,
                    // 첫번째 이미지를 바로 쓰기 위해 별도 필드도 만들어둠
                    imgPath: null,
                    imgName: null,
                    images: []
                };
            }

            if (row.imgId) {
                // 이미지 배열에 추가
                feedMap[row.feedId].images.push({
                    imgId: row.imgId,
                    imgName: row.imgName,
                    imgPath: row.imgPath
                });

                // 첫번째 이미지라면 대표 이미지로 세팅
                if (!feedMap[row.feedId].imgPath) {
                    feedMap[row.feedId].imgPath = row.imgPath;
                    feedMap[row.feedId].imgName = row.imgName;
                }
            }
        });

        let list = Object.values(feedMap);

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
    let { userId, title, content } = req.body;

    try {
        let sql = `
            INSERT INTO tbl_feed (userId, title, content, feedType)
            VALUES (?, ?, ?, 'NORMAL')
        `;

        let [result] = await db.query(sql, [userId, title, content]);

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
// 게시하기 모달에서 multipart 로 보낼 때 사용
// form-data 예시
//  userId: 222
//  title: 제목
//  content: 내용
//  file: 이미지1
//  file: 이미지2 ...
router.post("/write", upload.array('file', 5), async (req, res) => {
    let { userId, title, content } = req.body;
    const files = req.files || [];

    try {
        // 1. 피드 먼저 저장
        let sql = `
            INSERT INTO tbl_feed (userId, title, content, feedType)
            VALUES (?, ?, ?, 'NORMAL')
        `;
        let [feedResult] = await db.query(sql, [userId, title, content]);
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
// 기존 구조 유지, 한 피드에 여러번 호출해도 됨
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
        // FK 에 ON DELETE CASCADE 걸려있으면 아래 한 줄이면 됨
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

module.exports = router;
