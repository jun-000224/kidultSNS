const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const db = require("../db");
const jwt = require('jsonwebtoken');

const JWT_KEY = "server_secret_key";

// 유저 정보 조회
router.get("/:userId", async (req, res) => {
    let { userId } = req.params;

    try {
        let sql =
            "SELECT U.*, IFNULL(T.cnt, 0) cnt " +
            "FROM tbl_user U " +
            "LEFT JOIN ( " +
            "   SELECT userId, COUNT(*) cnt " +
            "   FROM tbl_feed " +
            "   GROUP BY userId " +
            ") T ON U.userId = T.userId " +
            "WHERE U.userId = ?";

        let [list] = await db.query(sql, [userId]);

        res.json({
            user: list[0],
            result: "success"
        });

    } catch (error) {
        console.log(error);
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
