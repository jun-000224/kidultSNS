// server/routes/feed.js
const express = require('express');
const router = express.Router();
const db = require("../db");
const authMiddleware = require("../auth");
const multer = require('multer');
<<<<<<< HEAD
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
=======

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });


router.post('/upload', upload.array('file'), async (req, res) => {
    let {feedId} = req.body;
    const files = req.files;
    // const filename = req.file.filename; 
    // const destination = req.file.destination; 
    try{
        let results = [];
        let host = `${req.protocol}://${req.get("host")}/`;
        for(let file of files){
            let filename = file.filename;
            let destination = file.destination;
            let query = "INSERT INTO TBL_FEED_IMG VALUES(NULL, ?, ?, ?)";
            let result = await db.query(query, [feedId, filename, host+destination+filename]);
            results.push(result);
        }
        res.json({
            message : "result",
            result : results
        });
    } catch(err){
        console.log(err);
        res.status(500).send("Server Error");
    }
});

router.get("/:userId", async (req, res)=>{
    console.log(`${req.protocol}://${req.get("host")}`);
>>>>>>> b1e27c0d9d7bab1705a5d12686ff62f70746639a
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

<<<<<<< HEAD
// 피드 삭제
router.delete("/:feedId", authMiddleware, async (req, res) => {
    let { feedId } = req.params;

    try {
        // 자식 먼저 지우고 싶으면 TBL_FEED_IMG DELETE도 추가 가능
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
        console.log(result);
        res.json({
            result,
            feedId: result.insertId,   // ✅ 프론트에서 이미지 업로드할 때 필요
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
            // imgPath에는 URL 기준 경로를 저장 (/uploads/파일명)
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
=======
router.delete("/:feedId", authMiddleware, async (req, res) => {
    let {feedId} = req.params;
    
    try {
        let sql = "DELETE FROM TBL_FEED WHERE ID = ?";
        let result = await db.query(sql, [feedId]);
        res.json({
            result : result,
            msg : "삭제 완료"
        });
    } catch (error) {
        console.log("에러 발생!");
    }
})

router.post("/", async (req, res)=>{
    let { userId, content } = req.body;
    try {
        let sql = "INSERT INTO TBL_FEED VALUES(NULL, ?, ? , NOW())";
        let result = await db.query(sql, [userId, content]);
        console.log(result);
        res.json({
            result,
            msg : "success"
        })

    } catch (error) {
        console.log(error);
    }
})

module.exports = router;
>>>>>>> b1e27c0d9d7bab1705a5d12686ff62f70746639a
