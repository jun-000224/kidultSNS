// src/components/Feed.js
import React, { useEffect, useState } from 'react';
import {
  Typography,
  Box,
  Card,
  CardMedia,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  CardHeader,
  Paper
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { jwtDecode } from "jwt-decode";
import { useNavigate } from 'react-router-dom';

function Feed() {
  // 모달 열림 여부
  const [open, setOpen] = useState(false);
  // 선택된 피드 정보
  const [selectedFeed, setSelectedFeed] = useState(null);
  // 댓글 목록
  const [comments, setComments] = useState([]);
  // 새 댓글 입력값
  const [newComment, setNewComment] = useState('');
  // 피드 목록
  const [feeds, setFeeds] = useState([]);
  // 우측 프로필 카드용 유저 정보
  const [user, setUser] = useState(null);

  const navigate = useNavigate();

  // 피드 목록 조회
  function fnFeeds() {
    const token = localStorage.getItem("token");

    if (token) {
      const decoded = jwtDecode(token);

      fetch("http://localhost:3010/feed/" + decoded.userId)
        .then(res => res.json())
        .then(data => {
          setFeeds(data.list);
          console.log(data);
        });
    } else {
      alert("로그인 후 이용해주세요.");
      navigate("/");
    }
  }

  // 우측 프로필 카드용 유저 정보 조회
  function fnGetUser() {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = jwtDecode(token);

      fetch("http://localhost:3010/user/" + decoded.userId)
        .then(res => res.json())
        .then(data => {
          console.log("user ==> ", data);
          setUser(data.user);
        });
    }
  }

  // 첫 렌더링 시 피드 + 유저 정보 조회
  useEffect(() => {
    fnFeeds();
    fnGetUser();
  }, []);

  // 피드 클릭 시 상세 모달 열기
  const handleClickOpen = (feed) => {
    setSelectedFeed(feed);
    setOpen(true);
    // 임시 더미 댓글 데이터
    setComments([
      { id: 'user1', text: '멋진 피규어네요.' },
      { id: 'user2', text: '컬러감이 너무 예뻐요.' },
      { id: 'user3', text: '소장욕구 자극됩니다.' },
    ]);
    setNewComment('');
  };

  // 모달 닫기
  const handleClose = () => {
    setOpen(false);
    setSelectedFeed(null);
    setComments([]);
  };

  // 댓글 추가
  const handleAddComment = () => {
    if (newComment.trim()) {
      setComments([...comments, { id: 'currentUser', text: newComment }]);
      setNewComment('');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#ffffffff',
        paddingY: 4,
        paddingX: 3,
        display: 'flex',
        justifyContent: 'center'
      }}
    >
      {/* 가운데 피드 + 오른쪽 프로필을 감싸는 영역 */}
      <Box
        sx={{
          width: '100%',
          maxWidth: 1200,
          display: 'flex',
          gap: 4
        }}
      >
        {/* 중앙 피드 영역 */}
        <Box
          sx={{
            flex: 2,
            maxWidth: 700
          }}
        >
          {/* 타이틀 영역 */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h6"
              sx={{ color: '#111827', fontWeight: 700 }}
            >
              타임라인
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: '#6b7280' }}
            >
              팔로우한 유저들의 키덜트 피드가 시간 순서대로 보여집니다.
            </Typography>
          </Box>

          {/* 피드 카드 리스트 */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {feeds.length > 0 ? (
              feeds.map((feed) => (
                <Card
                  key={feed.id}
                  sx={{
                    backgroundColor: '#020617',
                    borderRadius: '18px',
                    overflow: 'hidden',
                    boxShadow: '0 18px 45px rgba(15,23,42,0.7)',
                    border: '1px solid rgba(30,64,175,0.6)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  onClick={() => handleClickOpen(feed)}
                >
                  {/* 카드 상단 프로필 영역 */}
                  <CardHeader
                    avatar={
                      <Avatar sx={{ bgcolor: '#1d4ed8' }}>
                        {feed.userName
                          ? feed.userName.charAt(0).toUpperCase()
                          : 'U'}
                      </Avatar>
                    }
                    title={
                      <Typography
                        variant="subtitle2"
                        sx={{ color: '#e5e7eb', fontWeight: 600 }}
                      >
                        {feed.userName || '키덜트 유저'}
                      </Typography>
                    }
                    subheader={
                      <Typography
                        variant="caption"
                        sx={{ color: '#9ca3af' }}
                      >
                        {feed.title || '오늘의 덕질 기록'}
                      </Typography>
                    }
                    sx={{
                      paddingBottom: 0,
                      background:
                        'linear-gradient(135deg, rgba(15,23,42,0.7), rgba(30,64,175,0.9))'
                    }}
                  />

                  {/* 이미지 영역 */}
                  {feed.imgPath && (
                    <CardMedia
                      component="img"
                      height="260"
                      image={feed.imgPath}
                      alt={feed.imgName}
                      sx={{
                        objectFit: 'cover'
                      }}
                    />
                  )}

                  {/* 내용 영역 */}
                  <CardContent
                    sx={{
                      background:
                        'linear-gradient(180deg, rgba(15,23,42,0.98), rgba(15,23,42,1))'
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#e5e7eb',
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      {feed.content}
                    </Typography>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Box
                sx={{
                  width: '100%',
                  textAlign: 'center',
                  color: '#9ca3af',
                  mt: 6
                }}
              >
                <Typography variant="body1">
                  아직 등록된 피드가 없습니다.
                </Typography>
                <Typography variant="body2">
                  첫 번째 키덜트 피드를 업로드해보세요.
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* 오른쪽 프로필 카드 영역 (md 이상에서만 보이게) */}
        <Box
          sx={{
            flex: 1,
            maxWidth: 200,
            marginLeft : 3,
            display: { xs: 'none', md: 'block' }
          }}
        >
          <Paper
            elevation={3}
            sx={{
              borderRadius: '18px',
              padding: 2.5,
              textAlign: 'center',
              backgroundColor: '#ffffff'
            }}
          >
            <Avatar
              alt="프로필 이미지"
              src={
                user?.profileImg
                  ? "http://localhost:3010/uploads/" + user.profileImg
                  : "https://images.unsplash.com/photo-1551963831-b3b1ca40c98e"
              }
              sx={{ width: 90, height: 90, margin: '0 auto', mb: 2 }}
            />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {user?.userName || '키덜트 유저'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6b7280', mb: 2 }}>
              @{user?.userId || 'user'}
            </Typography>

            <Typography variant="body2" sx={{ color: '#6b7280', mt: 1 }}>
              팔로잉
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {user?.following || 0}
            </Typography>
          </Paper>
        </Box>
      </Box>

      {/* 피드 상세 모달 */}
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="lg"
        PaperProps={{
          sx: {
            backgroundColor: '#020617',
            color: '#e5e7eb',
            borderRadius: '20px',
            border: '1px solid rgba(30,64,175,0.9)'
          }
        }}
      >
        <DialogTitle
          sx={{
            borderBottom: '1px solid rgba(51,65,85,0.9)',
            pr: 6
          }}
        >
          {selectedFeed?.title || '덕질 기록 상세'}
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleClose}
            aria-label="close"
            sx={{ position: 'absolute', right: 12, top: 10 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2,
            mt: 1
          }}
        >
          {/* 왼쪽 피드 내용 영역 */}
          <Box sx={{ flex: 2 }}>
            {selectedFeed?.imgPath && (
              <Box
                sx={{
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '1px solid rgba(30,64,175,0.7)',
                  mb: 2
                }}
              >
                <img
                  src={selectedFeed.imgPath}
                  alt={selectedFeed.imgName}
                  style={{
                    width: '100%',
                    display: 'block'
                  }}
                />
              </Box>
            )}

            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, mb: 1 }}
            >
              {selectedFeed?.userName || '키덜트 유저'}
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {selectedFeed?.content}
            </Typography>
          </Box>

          {/* 오른쪽 댓글 영역 */}
          <Box
            sx={{
              flex: 1,
              minWidth: { xs: '100%', md: '320px' },
              borderLeft: { md: '1px solid rgba(51,65,85,0.9)' },
              paddingLeft: { md: 2 },
              pt: { xs: 2, md: 0 }
            }}
          >
            <Typography
              variant="h6"
              sx={{ mb: 1, fontSize: '1rem', fontWeight: 600 }}
            >
              댓글
            </Typography>

            <List
              sx={{
                maxHeight: 260,
                overflowY: 'auto',
                mb: 1
              }}
            >
              {comments.map((comment, index) => (
                <ListItem key={index} alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: '#1d4ed8' }}>
                      {comment.id.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography
                        variant="body2"
                        sx={{ color: '#e5e7eb' }}
                      >
                        {comment.text}
                      </Typography>
                    }
                    secondary={
                      <Typography
                        variant="caption"
                        sx={{ color: '#9ca3af' }}
                      >
                        {comment.id}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>

            <TextField
              label="댓글을 입력하세요"
              variant="outlined"
              fullWidth
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              InputLabelProps={{ style: { color: '#9ca3af' } }}
              InputProps={{
                style: {
                  color: '#e5e7eb',
                  backgroundColor: '#020617',
                  borderRadius: 10
                }
              }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddComment}
              sx={{
                marginTop: 1,
                width: '100%',
                borderRadius: '999px',
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              댓글 추가
            </Button>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            borderTop: '1px solid rgba(51,65,85,0.9)',
            padding: 2
          }}
        >
          <Button
            onClick={() => {
              console.log(selectedFeed);
              fetch("http://localhost:3010/feed/" + selectedFeed.id, {
                method: "DELETE",
                headers: {
                  "Authorization": "Bearer " + localStorage.getItem("token")
                }
              })
                .then(res => res.json())
                .then(data => {
                  alert("삭제되었습니다.");
                  setOpen(false);
                  fnFeeds();
                });
            }}
            variant="contained"
            color="primary"
            sx={{
              borderRadius: '999px',
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            삭제
          </Button>
          <Button
            onClick={handleClose}
            color="primary"
            sx={{
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            닫기
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Feed;
