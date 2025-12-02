// server/routes/notification.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const authMiddleware = require("../auth");

// 날짜 포맷 함수
// 오늘 글  : YYYY-MM-DD HH:mm
// 이전 글  : YYYY-MM-DD
function formatDateTime(value) {
    if (!value) return null;

    const date = new Date(value);
    if (isNaN(date.getTime())) {
        // 혹시 이상한 값이면 원본 그대로 반환
        return value;
    }

    const pad = (n) => String(n).padStart(2, "0");

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hour = pad(date.getHours());
    const minute = pad(date.getMinutes());

    const today = new Date();
    const isSameDay =
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate();

    if (isSameDay) {
        return `${year}-${month}-${day} ${hour}:${minute}`;
    } else {
        return `${year}-${month}-${day}`;
    }
}

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

        // 여기서 바로 cdatetime을 보기 좋은 문자열로 가공
        const list = rows.map((row) => {
            return {
                ...row,
                cdatetime: formatDateTime(row.cdatetime)
            };
        });

        res.json({
            result: "success",
            list
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

// 안 읽은 알림 개수 조회
// GET /notification/unread-count
router.get("/unread-count", authMiddleware, async (req, res) => {
    const loginUserId = req.user.userId;

    try {
        const [rows] = await db.query(
            "SELECT COUNT(*) AS cnt FROM tbl_notification WHERE receiverId = ? AND isRead = 0",
            [loginUserId]
        );

        res.json({
            result: "success",
            notificationCnt: rows[0].cnt
        });
    } catch (err) {
        console.log("GET /notification/unread-count error:", err);
        res.status(500).json({ result: "fail" });
    }
});

module.exports = router;
