// server/routes/user.js
const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const db = require("../db");
const jwt = require('jsonwebtoken');

const JWT_KEY = "server_secret_key";

// 유저 정보 조회 + 해당 유저 게시물 목록 조회
router.get("/:userId", async (req, res) => {
    let { userId } = req.params;

    try {
        // 유저 기본 정보 + 게시물 개수
        let sqlUser =
            "SELECT U.userId, U.pwd, U.userName, U.addr, U.phone, " +
            "       U.cdatetime, U.udatetime, U.follower, U.following, " +
            "       U.intro, U.profileImgPath, IFNULL(F.cnt, 0) AS feedCnt " +
            "FROM tbl_user U " +
            "LEFT JOIN ( " +
            "   SELECT userId, COUNT(*) AS cnt " +
            "   FROM tbl_feed " +
            "   GROUP BY userId " +
            ") F ON U.userId = F.userId " +
            "WHERE U.userId = ?";

        let [userList] = await db.query(sqlUser, [userId]);

        // 유저가 작성한 게시물 목록 + 썸네일 이미지 경로
        let sqlFeed =
            "SELECT F.feedId, F.title, F.content, F.feedType, F.viewCnt, " +
            "       F.cdatetime, F.udatetime, T.imgPath " +
            "FROM tbl_feed F " +
            "LEFT JOIN ( " +
            "   SELECT feedId, MIN(imgPath) AS imgPath " +
            "   FROM tbl_feed_img " +
            "   GROUP BY feedId " +
            ") T ON F.feedId = T.feedId " +
            "WHERE F.userId = ? " +
            "ORDER BY F.cdatetime DESC";

        let [feedList] = await db.query(sqlFeed, [userId]);

        res.json({
            user: userList[0],
            feeds: feedList,
            result: "success"
        });

    } catch (error) {
        console.log("GET /user/:userId error ===> ", error);
        res.status(500).json({ result: "fail" });
    }
});

// 회원가입
router.post("/join", async (req, res) => {
    let { userId, pwd, userName } = req.body;

    try {
        let hashPwd = await bcrypt.hash(pwd, 10);
        let sql = "INSERT INTO tbl_user(userId, pwd, userName) VALUES (?, ?, ?)";

        let result = await db.query(sql, [userId, hashPwd, userName]);

        res.json({
            result: result,
            msg: "가입되었습니다!"
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ result: "fail" });
    }
});

// 로그인
router.post("/login", async (req, res) => {
    let { userId, pwd } = req.body;

    try {
        let sql = "SELECT * FROM tbl_user WHERE userId = ?";
        let [list] = await db.query(sql, [userId]);

        let msg = "";
        let result = false;
        let token = null;

        if (list.length > 0) {
            let match = await bcrypt.compare(pwd, list[0].pwd);

            if (match) {
                msg = list[0].userName + "님 환영합니다!";
                result = true;

                // 토큰에 들어가는 정보
                let user = {
                    userId: list[0].userId,
                    userName: list[0].userName,
                    status: "A"
                };

                token = jwt.sign(user, JWT_KEY, { expiresIn: '1h' });
            } else {
                msg = "패스워드를 확인해주세요.";
            }
        } else {
            msg = "아이디가 존재하지 않습니다.";
        }

        res.json({
            result: result,
            msg: msg,
            token: token
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ result: "fail" });
    }
});

module.exports = router;
