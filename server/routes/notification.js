// server/routes/notification.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const authMiddleware = require("../auth");

// 알림 목록 조회
// GET /notification
router.get("/", authMiddleware, async (req, res) => {
    const loginUserId = req.user.userId;

    try {
        const sql =
            "SELECT N.notiId, N.receiverId, N.senderId, N.type, N.feedId, " +
            "       N.isRead, N.cdatetime, " +
            "       U.userName AS senderName, U.profileImgPath AS senderProfileImgPath, " +
            "       F.title AS feedTitle " +
            "FROM tbl_notification N " +
            "JOIN tbl_user U ON N.senderId = U.userId " +
            "LEFT JOIN tbl_feed F ON N.feedId = F.feedId " +
            "WHERE N.receiverId = ? " +
            "ORDER BY N.cdatetime DESC " +
            "LIMIT 50";

        const [rows] = await db.query(sql, [loginUserId]);

        res.json({
            result: "success",
            list: rows
        });
    } catch (err) {
        console.log("GET /notification error:", err);
        res.status(500).json({ result: "fail" });
    }
});

// 알림 전체 읽음 처리
// POST /notification/read-all
router.post("/read-all", authMiddleware, async (req, res) => {
    const loginUserId = req.user.userId;

    try {
        await db.query(
            "UPDATE tbl_notification SET isRead = 1 WHERE receiverId = ? AND isRead = 0",
            [loginUserId]
        );

        res.json({ result: "success" });
    } catch (err) {
        console.log("POST /notification/read-all error:", err);
        res.status(500).json({ result: "fail" });
    }
});


module.exports = router;
