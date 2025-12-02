// server/routes/user.js
const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const db = require("../db");
const jwt = require('jsonwebtoken');
const authMiddleware = require("../auth");

const JWT_KEY = "server_secret_key";

// 요청 헤더에서 토큰 파싱해서 userId 얻는 헬퍼 (옵션용)
function getLoginUserId(req) {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.split(' ')[1];

    if (!token) return null;

    try {
        const decoded = jwt.verify(token, JWT_KEY);
        return decoded.userId;
    } catch (e) {
        console.log('user route token decode error:', e.message);
        return null;
    }
}

/**
 * 유저 정보 조회 + 해당 유저 게시물 목록 조회
 * GET /user/:userId
 */
router.get("/:userId", async (req, res) => {
    let { userId } = req.params;
    const loginUserId = getLoginUserId(req);

    try {
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

        if (userList.length === 0) {
            return res.status(404).json({ result: "fail", msg: "유저가 존재하지 않습니다." });
        }

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

        let isFollowing = false;
        if (loginUserId) {
            let [followRows] = await db.query(
                "SELECT * FROM tbl_follow WHERE followerId = ? AND followingId = ?",
                [loginUserId, userId]
            );
            isFollowing = followRows.length > 0;
        }

        res.json({
            user: userList[0],
            feeds: feedList,
            isFollowing,
            result: "success"
        });

    } catch (error) {
        console.log("GET /user/:userId error ===> ", error);
        res.status(500).json({ result: "fail" });
    }
});

/**
 * 팔로우 토글
 * POST /user/:userId/follow
 */
router.post("/:userId/follow", authMiddleware, async (req, res) => {
    const { userId: targetUserId } = req.params;   // 팔로우 당하는 사람
    const loginUserId = req.user.userId;          // 팔로우 하는 사람

    try {
        if (loginUserId === targetUserId) {
            return res.status(400).json({
                result: "fail",
                msg: "자기 자신은 팔로우할 수 없습니다."
            });
        }

        // 이미 팔로우 중인지 확인
        let [rows] = await db.query(
            "SELECT * FROM tbl_follow WHERE followerId = ? AND followingId = ?",
            [loginUserId, targetUserId]
        );

        let isFollowing;

        if (rows.length > 0) {
            // 이미 팔로우 → 언팔
            await db.query(
                "DELETE FROM tbl_follow WHERE followerId = ? AND followingId = ?",
                [loginUserId, targetUserId]
            );
            isFollowing = false;
        } else {
            // 아직 안 팔로우 → 팔로우 추가
            await db.query(
                "INSERT INTO tbl_follow (followerId, followingId) VALUES (?, ?)",
                [loginUserId, targetUserId]
            );
            isFollowing = true;

            // 팔로우 알림 생성 (상대에게)
            try {
                await db.query(
                    "INSERT INTO tbl_notification " +
                    "  (receiverId, senderId, type, feedId, isRead) " +
                    "VALUES (?, ?, 'FOLLOW', NULL, 0)",
                    [targetUserId, loginUserId]
                );
            } catch (notiErr) {
                console.log("follow notification insert error:", notiErr);
            }
        }

        // 최신 팔로워 수 / 팔로잉 수 재계산
        let [followerRows] = await db.query(
            "SELECT COUNT(*) AS cnt FROM tbl_follow WHERE followingId = ?",
            [targetUserId]
        );
        const followerCount = followerRows[0]?.cnt || 0;

        let [followingRows] = await db.query(
            "SELECT COUNT(*) AS cnt FROM tbl_follow WHERE followerId = ?",
            [loginUserId]
        );
        const followingCount = followingRows[0]?.cnt || 0;

        await db.query(
            "UPDATE tbl_user SET follower = ? WHERE userId = ?",
            [followerCount, targetUserId]
        );
        await db.query(
            "UPDATE tbl_user SET following = ? WHERE userId = ?",
            [followingCount, loginUserId]
        );

        res.json({
            result: "success",
            isFollowing,
            followerCount
        });

    } catch (error) {
        console.log("POST /user/:userId/follow error ===> ", error);
        res.status(500).json({ result: "fail" });
    }
});

/**
 * 팔로워 리스트
 */
router.get("/:userId/followers", async (req, res) => {
    const { userId } = req.params;

    try {
        const sql =
            "SELECT U.userId, U.userName, U.profileImgPath " +
            "FROM tbl_follow F " +
            "JOIN tbl_user U ON F.followerId = U.userId " +
            "WHERE F.followingId = ?";

        const [rows] = await db.query(sql, [userId]);

        res.json({
            result: "success",
            list: rows
        });

    } catch (error) {
        console.log("GET /user/:userId/followers error ===> ", error);
        res.status(500).json({ result: "fail" });
    }
});

/**
 * 팔로잉 리스트
 */
router.get("/:userId/following", async (req, res) => {
    const { userId } = req.params;

    try {
        const sql =
            "SELECT U.userId, U.userName, U.profileImgPath " +
            "FROM tbl_follow F " +
            "JOIN tbl_user U ON F.followingId = U.userId " +
            "WHERE F.followerId = ?";

        const [rows] = await db.query(sql, [userId]);

        res.json({
            result: "success",
            list: rows
        });

    } catch (error) {
        console.log("GET /user/:userId/following error ===> ", error);
        res.status(500).json({ result: "fail" });
    }
});

/**
 * 회원가입
 */
router.post("/join", async (req, res) => {
    let { userId, pwd, userName, addr, phone } = req.body;

    try {
        let hashPwd = await bcrypt.hash(pwd, 10);

        let sql = `
            INSERT INTO tbl_user (userId, pwd, userName, addr, phone)
            VALUES (?, ?, ?, ?, ?)
        `;

        let result = await db.query(sql, [userId, hashPwd, userName, addr, phone]);

        res.json({
            result: result,
            msg: "가입되었습니다!"
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ result: "fail" });
    }
});

/**
 * 로그인
 */
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

/**
 * 로그아웃 (현재는 토큰 제거는 프론트에서 처리)
 */
router.post("/logout", async (req, res) => {
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

const path = require('path');
const multer = require('multer');

// 업로드 폴더
const uploadDir = path.join(__dirname, '..', 'uploads');

const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const uploadProfile = multer({ storage: profileStorage });

/**
 * 프로필 수정
 * PUT /user/profile
 */
router.put('/profile', authMiddleware, uploadProfile.single('profileImg'), async (req, res) => {
  const userId = req.user.userId;
  const { userName } = req.body;
  const file = req.file;

  if (!userName || !userName.trim()) {
    return res.status(400).json({
      result: 'fail',
      message: '닉네임은 필수입니다.'
    });
  }

  try {
    const [rows] = await db.query(
      'SELECT feedCnt FROM tbl_user WHERE userId = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        result: 'fail',
        message: '존재하지 않는 유저입니다.'
      });
    }

    const feedCnt = rows[0].feedCnt || 0;
    const canChangeProfileImage = feedCnt >= 10;

    let profileImgPath = null;

    if (file && canChangeProfileImage) {
      profileImgPath = '/uploads/' + file.filename;
    }

    let sql = 'UPDATE tbl_user SET userName = ?';
    const params = [userName.trim()];

    if (profileImgPath) {
      sql += ', profileImgPath = ?';
      params.push(profileImgPath);
    }

    sql += ' WHERE userId = ?';
    params.push(userId);

    await db.query(sql, params);

    const [userRows] = await db.query(
      'SELECT userId, userName, intro, profileImgPath, feedCnt, follower, following FROM tbl_user WHERE userId = ?',
      [userId]
    );

    const updatedUser = userRows[0];

    return res.json({
      result: 'success',
      user: updatedUser
    });
  } catch (err) {
    console.log('profile update error:', err);
    return res.status(500).json({
      result: 'fail',
      message: 'profile update error'
    });
  }
});

module.exports = router;
