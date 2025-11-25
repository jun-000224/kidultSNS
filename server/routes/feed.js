// server/routes/feed.js
const express = require('express');
const router = express.Router();
const db = require("../db");
const authMiddleware = require("../auth");
const multer = require('multer');
const path = require('path');

// 업로드 폴더 (루트 기준 ../uploads)
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

const upload = multer({ storage });

// 피드 목록 조회 (유저별)
router.get("/:userId", async (req, res) => {
    let { userId } = req.params;

    try {
        let sql = "SELECT * "
            + "FROM TBL_FEED F "
            + "INNER JOIN TBL_FEED_IMG I ON F.ID = I.FEEDID "
            + "WHERE F.USERID = ? ";
        let [list] = await db.query(sql, [userId]);

        res.json({
            list,
            result: "success"
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ result: "fail" });
    }
});

// 피드 삭제
router.delete("/:feedId", authMiddleware, async (req, res) => {
    let { feedId } = req.params;

    try {
        let sql = "DELETE FROM TBL_FEED WHERE ID = ?";
        let [result] = await db.query(sql, [feedId]);

        res.json({
            result: "success",
            msg: "삭제 완료"
        });

    } catch (error) {
        console.log("에러 발생!", error);
        res.status(500).json({ result: "fail" });
    }
});

// 피드 등록 (텍스트)
router.post("/", async (req, res) => {
    let { userId, content } = req.body;

    try {
        let sql = "INSERT INTO TBL_FEED VALUES(NULL, ?, ?, NOW())";
        let [result] = await db.query(sql, [userId, content]);

        res.json({
            result,
            feedId: result.insertId,   // 업로드 시 필요한 feedId 반환
            msg: "success"
        });

    } catch (error) {
        console.log("에러 발생!", error);
        res.status(500).json({ msg: "fail" });
    }
});

// 파일 업로드
router.post('/upload', upload.array('file'), async (req, res) => {
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

            let query = "INSERT INTO TBL_FEED_IMG VALUES(NULL, ?, ?, ?)";
            let [result] = await db.query(query, [feedId, filename, imgPath]);

            results.push(result);
        }

        res.json({
            message: "success",
            result: results
        });

    } catch (err) {
        console.log("에러 발생!", err);
        res.status(500).send("Server Error");
    }
});

module.exports = router;
