// server/routes/bookmark.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../auth');

/**
 * 1) 북마크 토글
 *    POST /bookmark/toggle/:feedId
 *    - 이미 북마크 되어 있으면 삭제
 *    - 없으면 추가
 *    - 결과로 bookmarked(불리언) + bookmarkCount 리턴
 */
router.post('/toggle/:feedId', authMiddleware, async (req, res) => {
  const { feedId } = req.params;
  const userId = req.user.userId; // 토큰에서 꺼낸 로그인 유저

  try {
    // 1. 이미 북마크 했는지 확인
    const [rows] = await db.query(
      'SELECT * FROM tbl_feed_bookmark WHERE userId = ? AND feedId = ?',
      [userId, feedId]
    );

    let bookmarked;

    if (rows.length > 0) {
      // 북마크 되어 있으면 삭제
      await db.query(
        'DELETE FROM tbl_feed_bookmark WHERE userId = ? AND feedId = ?',
        [userId, feedId]
      );
      bookmarked = false;
    } else {
      // 안 되어 있으면 추가
      await db.query(
        'INSERT INTO tbl_feed_bookmark (userId, feedId) VALUES (?, ?)',
        [userId, feedId]
      );
      bookmarked = true;
    }

    // 2. 이 피드의 전체 북마크 개수
    const [cntRows] = await db.query(
      'SELECT COUNT(*) AS bookmarkCount FROM tbl_feed_bookmark WHERE feedId = ?',
      [feedId]
    );
    const bookmarkCount = cntRows[0]?.bookmarkCount || 0;

    return res.json({
      result: 'success',
      bookmarked,
      bookmarkCount
    });
  } catch (err) {
    console.log('bookmark toggle error:', err);
    return res.status(500).json({
      result: 'fail',
      message: 'bookmark toggle error'
    });
  }
});

/**
 * 2) 내가 북마크한 피드 리스트
 *    GET /bookmark/list
 *    - 로그인 유저 기준
 */
router.get('/list', authMiddleware, async (req, res) => {
  const userId = req.user.userId;

  try {
    const sql = `
      SELECT 
        F.*,
        U.userName,
        I.imgId,
        I.imgName,
        I.imgPath,
        IFNULL(L.cntLike, 0) AS likeCount
      FROM tbl_feed_bookmark B
      JOIN tbl_feed F ON B.feedId = F.feedId
      JOIN tbl_user U ON F.userId = U.userId
      LEFT JOIN tbl_feed_img I ON F.feedId = I.feedId
      LEFT JOIN (
        SELECT feedId, COUNT(*) AS cntLike
        FROM tbl_feed_like
        GROUP BY feedId
      ) L ON F.feedId = L.feedId
      WHERE B.userId = ?
      ORDER BY B.cdatetime DESC
    `;

    const [rows] = await db.query(sql, [userId]);

    // feedId 기준으로 이미지 묶기
    const feedMap = new Map();

    rows.forEach((row) => {
      if (!feedMap.has(row.feedId)) {
        feedMap.set(row.feedId, {
          feedId: row.feedId,
          userId: row.userId,
          userName: row.userName,
          title: row.title,
          content: row.content,
          hash: row.hash,
          cdatetime: row.cdatetime,
          likeCount: row.likeCount || 0,
          imgPath: null,
          imgName: null,
          images: []
        });
      }

      const feedData = feedMap.get(row.feedId);

      if (row.imgId) {
        feedData.images.push({
          imgId: row.imgId,
          imgName: row.imgName,
          imgPath: row.imgPath
        });

        if (!feedData.imgPath) {
          feedData.imgPath = row.imgPath;
          feedData.imgName = row.imgName;
        }
      }
    });

    const list = Array.from(feedMap.values());

    return res.json({
      result: 'success',
      list
    });
  } catch (err) {
    console.log('bookmark list error:', err);
    return res.status(500).json({
      result: 'fail',
      message: 'bookmark list error'
    });
  }
});

module.exports = router;
