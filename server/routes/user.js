// server/routes/user.js
const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const db = require("../db");
const jwt = require('jsonwebtoken');
const authMiddleware = require("../auth");
const multer = require("multer");
const path = require("path");

const JWT_KEY = "server_secret_key";

// 업로드 폴더 (feed.js와 동일 경로 사용)
const uploadDir = path.join(__dirname, "..", "uploads");

// multer 설정 (프로필 이미지용)
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
 * 회원가입
 * POST /user/join
 * body: { userId, pwd, userName, addr, phone }
 */
router.post("/join", async (req, res) => {
  const { userId, pwd, userName, addr, phone } = req.body;

  if (!userId || !pwd || !userName) {
    return res.status(400).json({
      result: "fail",
      msg: "필수 항목이 누락되었습니다."
    });
  }

  try {
    // 아이디 중복 체크
    const [existRows] = await db.query(
      "SELECT userId FROM tbl_user WHERE userId = ?",
      [userId]
    );
    if (existRows.length > 0) {
      return res.json({
        result: "fail",
        msg: "이미 사용 중인 아이디입니다."
      });
    }

    const hashedPwd = await bcrypt.hash(pwd, 10);

    const sql =
      "INSERT INTO tbl_user " +
      "  (userId, pwd, userName, addr, phone, follower, following, intro, profileImgPath, status, cdatetime) " +
      "VALUES (?, ?, ?, ?, ?, 0, 0, NULL, NULL, 'c', NOW())";

    await db.query(sql, [userId, hashedPwd, userName, addr || "", phone || ""]);

    res.json({
      result: "success",
      msg: "회원가입이 완료되었습니다."
    });
  } catch (error) {
    console.log("POST /user/join error ===> ", error);
    res.status(500).json({
      result: "fail",
      msg: "회원가입 중 오류가 발생했습니다."
    });
  }
});

/**
 * 로그인
 * POST /user/login
 * body: { userId, pwd }
 */
router.post("/login", async (req, res) => {
  const { userId, pwd } = req.body;

  if (!userId || !pwd) {
    return res.status(400).json({
      result: "fail",
      msg: "아이디와 비밀번호를 입력해주세요."
    });
  }

  try {
    const [rows] = await db.query(
      "SELECT * FROM tbl_user WHERE userId = ?",
      [userId]
    );

    if (rows.length === 0) {
      return res.json({
        result: "fail",
        msg: "아이디 또는 비밀번호가 올바르지 않습니다."
      });
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(pwd, user.pwd);
    if (!isMatch) {
      return res.json({
        result: "fail",
        msg: "아이디 또는 비밀번호가 올바르지 않습니다."
      });
    }

    // JWT 발급
    const token = jwt.sign(
      {
        userId: user.userId
      },
      JWT_KEY,
      {
        expiresIn: "7d"
      }
    );

    res.json({
      result: "success",
      token,
      user: {
        userId: user.userId,
        userName: user.userName,
        addr: user.addr,
        phone: user.phone,
        follower: user.follower,
        following: user.following,
        intro: user.intro,
        profileImgPath: user.profileImgPath,
        status: user.status
      }
    });
  } catch (error) {
    console.log("POST /user/login error ===> ", error);
    res.status(500).json({
      result: "fail",
      msg: "로그인 중 오류가 발생했습니다."
    });
  }
});

/**
 * 내 정보 조회 (옵션)
 * GET /user/me
 * 헤더: Authorization: Bearer 토큰
 */
router.get("/me", authMiddleware, async (req, res) => {
  const loginUserId = req.user.userId;

  try {
    const [rows] = await db.query(
      "SELECT userId, userName, addr, phone, follower, following, intro, profileImgPath, status, cdatetime, udatetime " +
      "FROM tbl_user WHERE userId = ?",
      [loginUserId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ result: "fail", msg: "유저가 존재하지 않습니다." });
    }

    res.json({
      result: "success",
      user: rows[0]
    });
  } catch (error) {
    console.log("GET /user/me error ===> ", error);
    res.status(500).json({ result: "fail" });
  }
});

/**
 * 프로필 수정 (닉네임 + 프로필 이미지)
 * PUT /user/profile
 * 헤더: Authorization: Bearer 토큰
 * body(form-data):
 *   - userName (text)
 *   - profileImg (file, 선택)
 */
router.put("/profile", authMiddleware, upload.single("profileImg"), async (req, res) => {
  const loginUserId = req.user.userId;
  const { userName } = req.body;
  const file = req.file;

  if (!userName || !userName.trim()) {
    return res.status(400).json({
      result: "fail",
      message: "닉네임을 입력해주세요."
    });
  }

  try {
    // 기존 유저 정보 조회
    const [rows] = await db.query(
      "SELECT * FROM tbl_user WHERE userId = ?",
      [loginUserId]
    );
    if (rows.length === 0) {
      return res.status(404).json({
        result: "fail",
        message: "유저가 존재하지 않습니다."
      });
    }

    const user = rows[0];

    let profileImgPath = user.profileImgPath;

    // 브론즈 이상부터 프로필 이미지 변경 가능 (b, s, g, e, a)
    const status = (user.status || 'c').toLowerCase();
    const canChangeProfileImage = ['b', 's', 'g', 'e', 'a'].includes(status);

    if (file && canChangeProfileImage) {
      profileImgPath = "/uploads/" + file.filename;
    }

    await db.query(
      "UPDATE tbl_user SET userName = ?, profileImgPath = ?, udatetime = NOW() WHERE userId = ?",
      [userName.trim(), profileImgPath, loginUserId]
    );

    const [updatedRows] = await db.query(
      "SELECT userId, userName, addr, phone, follower, following, intro, profileImgPath, status, cdatetime, udatetime " +
      "FROM tbl_user WHERE userId = ?",
      [loginUserId]
    );

    res.json({
      result: "success",
      message: "프로필이 수정되었습니다.",
      user: updatedRows[0]
    });
  } catch (error) {
    console.log("PUT /user/profile error ===> ", error);
    res.status(500).json({
      result: "fail",
      message: "프로필 수정 중 오류가 발생했습니다."
    });
  }
});

/**
 * 유저 정보 조회 + 해당 유저 게시물 목록 조회
 * GET /user/:userId
 *  - URL 파라미터: :userId (페이지 주인)
 *  - 헤더 토큰 있으면: 로그인 유저 기준으로 isFollowing 계산
 */
router.get("/:userId", async (req, res) => {
  let { userId } = req.params;
  const loginUserId = getLoginUserId(req); // 없으면 null

  try {
    // 유저 기본 정보 + 게시물 개수
    let sqlUser =
      "SELECT U.userId, U.pwd, U.userName, U.addr, U.phone, " +
      "       U.cdatetime, U.udatetime, U.follower, U.following, " +
      "       U.intro, U.profileImgPath, IFNULL(F.cnt, 0) AS feedCnt, U.status " +
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

    // 유저가 작성한 게시물 목록 + 썸네일 이미지 경로 (+ hash 추가)
    let sqlFeed =
      "SELECT F.feedId, F.title, F.content, F.hash, F.feedType, F.viewCnt, " +
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

    // 로그인 되어 있으면 이 유저를 팔로우 중인지 여부 확인
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
 * 헤더: Authorization: Bearer 토큰
 */
router.post("/:userId/follow", authMiddleware, async (req, res) => {
  const { userId: targetUserId } = req.params;
  const loginUserId = req.user.userId;

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
 * 특정 유저의 팔로워 목록
 * GET /user/:userId/followers
 */
router.get("/:userId/followers", async (req, res) => {
  const { userId } = req.params;

  try {
    const sql =
      "SELECT U.userId, U.userName, U.profileImgPath, U.status " +
      "FROM tbl_follow F " +
      "JOIN tbl_user U ON F.followerId = U.userId " +
      "WHERE F.followingId = ? " +
      "ORDER BY U.userName ASC";

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
 * 특정 유저가 팔로우하는 목록(팔로잉)
 * GET /user/:userId/following
 */
router.get("/:userId/following", async (req, res) => {
  const { userId } = req.params;

  try {
    const sql =
      "SELECT U.userId, U.userName, U.profileImgPath, U.status " +
      "FROM tbl_follow F " +
      "JOIN tbl_user U ON F.followingId = U.userId " +
      "WHERE F.followerId = ? " +
      "ORDER BY U.userName ASC";

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

module.exports = router;
