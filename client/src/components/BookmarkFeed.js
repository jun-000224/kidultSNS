// src/components/BookmarkFeed.js
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardMedia,
  CardContent,
  IconButton
} from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

function getImgUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return 'http://localhost:3010' + path;
}

function BookmarkFeed() {
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);

  // 북마크 목록 조회
  const fetchBookmarks = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인 후 이용해주세요.');
      return;
    }

    fetch('http://localhost:3010/bookmark/list', {
      headers: {
        Authorization: 'Bearer ' + token
      }
    })
      .then((res) => res.json())
      .then((data) => {
        console.log('bookmark list ==> ', data);
        if (data.result === 'success') {
          const safe = Array.isArray(data.list)
            ? data.list.filter((f) => f != null)
            : [];
          setFeeds(safe);
        }
      })
      .catch((err) => {
        console.log(err);
        alert('북마크 목록을 가져오는 중 오류가 발생했습니다.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#f9fafb',
        paddingY: 4,
        paddingX: 3,
        display: 'flex',
        justifyContent: 'center'
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 900
        }}
      >
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            다시보기
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280', mt: 0.5 }}>
            북마크한 피드들을 한 번에 모아서 볼 수 있습니다.
          </Typography>
        </Box>

        {loading ? (
          <Typography>불러오는 중...</Typography>
        ) : feeds.length === 0 ? (
          <Box sx={{ mt: 6, textAlign: 'center', color: '#9ca3af' }}>
            <Typography variant="body1">
              북마크한 피드가 없습니다.
            </Typography>
            <Typography variant="body2">
              관심 있는 피드에 북마크를 추가해보세요.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {feeds.map((feed) => (
              <Card
                key={feed.feedId}
                sx={{
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 16px rgba(15,23,42,0.08)',
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#ffffff'
                }}
              >
                {feed.imgPath && (
                  <CardMedia
                    component="img"
                    image={getImgUrl(feed.imgPath)}
                    alt={feed.imgName}
                    sx={{
                      width: '100%',
                      height: 320,
                      objectFit: 'cover',
                      borderBottom: '1px solid #e5e7eb'
                    }}
                  />
                )}

                <CardContent sx={{ pb: 1 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ color: '#6b7280', mb: 0.5 }}
                  >
                    @{feed.userId} · {feed.userName}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: '#111827', whiteSpace: 'pre-wrap' }}
                  >
                    {feed.content}
                  </Typography>
                  {feed.hash && (
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#2563eb',
                        mt: 1,
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      {feed.hash}
                    </Typography>
                  )}
                </CardContent>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    px: 2,
                    pb: 1.5,
                    color: '#6b7280'
                  }}
                >
                  <IconButton size="small">
                    <ChatBubbleOutlineIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                  <IconButton size="small">
                    <FavoriteBorderIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                  <IconButton size="small">
                    <BookmarkIcon sx={{ fontSize: 20, color: '#0ea5e9' }} />
                  </IconButton>
                </Box>
              </Card>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default BookmarkFeed;
