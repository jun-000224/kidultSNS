const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const db = require("../db");
const jwt = require('jsonwebtoken');

// 해시 함수 실행 위해 사용할 키로 아주 긴 랜덤한 문자를 사용하길 권장하며, 노출되면 안됨.
const JWT_KEY = "server_secret_key"; 

router.get("/:userId", async (req, res) => {
    let {userId} = req.params;
    try {
       // 1. 두개 쿼리 써서 리턴
    //    let [list] = await db.query("SELECT * FROM TBL_USER WHERE USERID = ?", [userId]);
    //    let [cnt] = await db.query("SELECT COUNT(*) FROM TBL_FEED WHERE USERID = ?", [userId]);
    //    res.json({
    //     user : list[0],
    //     cnt : cnt[0]
    //    }) 

       // 2. 조인쿼리 만들어서 하나로 리턴
        let sql = 
            "SELECT U.*, IFNULL(T.CNT, 0) cnt " +
            "FROM TBL_USER U " +
            "LEFT JOIN ( " +
            "    SELECT USERID, COUNT(*) CNT " +
            "    FROM TBL_FEED " +
            "    GROUP BY USERID " +
            ") T ON U.USERID = T.USERID " +
            "WHERE U.USERID = ?";

        let [list] = await db.query(sql, [userId]);
        res.json({
            user : list[0],
            result : "success"
        })



    } catch (error) {
        console.log(error);
    }
})


router.post("/join", async (req, res) => {
    let {userId, pwd, userName} = req.body;
    try {
       let hashPwd =  await bcrypt.hash(pwd, 10);
       let sql = "INSERT INTO TBL_USER(USERID, PWD, USERNAME) VALUE (?, ?, ?)";
       let result = await db.query(sql, [userId, hashPwd, userName]);

       res.json({
        result : result,
        msg : "가입되었습니다!"
       });
    } catch (error) {
        console.log(error);
    }
})

router.post("/login", async (req, res) => {
    let {userId, pwd} = req.body;
    try {

       let sql = "SELECT * FROM TBL_USER WHERE USERID = ?";
       let [list] = await db.query(sql, [userId]);
       let msg = "";
       let result = false;
       let token = null;
       if(list.length > 0){ 
        let match = await bcrypt.compare(pwd, list[0].pwd);
        if(match){
            msg = list[0].userName + "님 환영합니다!"
            result = true;

            let user = {
                userId : list[0].userId,
                userName : list[0].userName,
                status : "A" // 권한 일단 하드코딩(db에 없어서..)
                // 권한 등 필요한 정보 추가
            };

            token = jwt.sign(user, JWT_KEY, {expiresIn : '1h'});
            console.log(token);

        } else {
            msg = "패스워드를 확인해주세요."
        }
       } else {
        msg = "아이디가 존재하지 않습니다."
       }
       res.json({
        result : result,
        msg : msg,
        token : token
       });
    } catch (error) {
        console.log(error);
    }
})

module.exports = router;