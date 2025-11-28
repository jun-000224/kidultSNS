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
  Paper
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'; // 댓글 아이콘
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';       // 좋아요 아이콘
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';       // 보관하기 아이콘
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

function Feed() {
  // 상세 모달 열림 여부
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

  // 우측 상단 검색어
  const [search, setSearch] = useState('');

  // 게시하기 모달용 상태
  const [writeOpen, setWriteOpen] = useState(false);
  const [writeTitle, setWriteTitle] = useState('');
  const [writeContent, setWriteContent] = useState('');
  const [writeFiles, setWriteFiles] = useState([]); // 게시 모달에서 선택한 이미지들

  const navigate = useNavigate();

  // 피드 목록 조회
  function fnFeeds() {
    const token = localStorage.getItem('token');

    if (token) {
      const decoded = jwtDecode(token);

      fetch('http://localhost:3010/feed/' + decoded.userId)
        .then((res) => res.json())
        .then((data) => {
          setFeeds(data.list);
          console.log(data);
        });
    } else {
      alert('로그인 후 이용해주세요.');
      navigate('/');
    }
  }

  // 우측 프로필 카드용 유저 정보 조회
  function fnGetUser() {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwtDecode(token);

      fetch('http://localhost:3010/user/' + decoded.userId)
        .then((res) => res.json())
        .then((data) => {
          console.log('user ==> ', data);
          setUser(data.user);
        });
    }
  }

  // 사이트 처음 진입 시 피드 + 유저 정보 조회
  useEffect(() => {
    fnFeeds();
    fnGetUser();
  }, []);

  // 피드 카드 클릭 시 상세 모달 열기
  const handleClickOpen = (feed) => {
    setSelectedFeed(feed);
    setOpen(true);
    // 현재는 더미 댓글
    setComments([
      { id: 'user1', text: '멋진 피규어네요.' },
      { id: 'user2', text: '컬러감이 너무 예뻐요.' },
      { id: 'user3', text: '소장욕구 자극됩니다.' }
    ]);
    setNewComment('');
  };

  // 상세 모달 닫기
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

  // 게시하기 모달 열기
  const handleOpenWrite = () => {
    setWriteOpen(true);
  };

  // 게시하기 모달 닫기
  const handleCloseWrite = () => {
    setWriteOpen(false);
    setWriteTitle('');
    setWriteContent('');
    setWriteFiles([]);
  };

  // 게시 모달에서 이미지 선택
  const handleWriteFileChange = (event) => {
    const selected = Array.from(event.target.files || []);
    const limited = selected.slice(0, 5); // 최대 5장까지
    setWriteFiles(limited);
  };

  // 게시하기 저장 (텍스트 + 이미지 여러장)
  const handleSubmitWrite = async () => {
    if (!writeContent.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인 후 이용해주세요.');
      return;
    }

    const decoded = jwtDecode(token);

    try {
      const formData = new FormData();
      formData.append('userId', decoded.userId);
      formData.append('title', writeTitle);
      formData.append('content', writeContent);

      writeFiles.forEach((file) => {
        formData.append('file', file);
      });

      const res = await fetch('http://localhost:3010/feed/write', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      console.log('write result ==> ', data);

      if (data.result === 'success') {
        alert('게시되었습니다.');
        handleCloseWrite();
        fnFeeds();
      } else {
        alert('게시 중 오류가 발생했습니다.');
      }
    } catch (e) {
      console.log(e);
      alert('오류가 발생했습니다.');
    }
  };

  // 이미지 경로 보정 함수
  const getImgUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return 'http://localhost:3010' + path;
  };

  return (
    <>
      {/* 메인 레이아웃 영역 */}
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
            maxWidth: 1100,
            display: 'flex',
            gap: 3
          }}
        >
          {/* 중앙 피드 영역 */}
          <Box
            sx={{
              flex: 3,
              pr: 1
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
              <Typography variant="body2" sx={{ color: '#6b7280' }}>
                오늘의 새로운 소식들을 확인해보세요
              </Typography>
            </Box>

            {/* 피드 카드 리스트 */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {feeds.length > 0 ? (
                feeds.map((feed) => (
                  // 아바타 + 카드 전체를 감싸는 영역
                  <Box
                    key={feed.feedId}
                    sx={{
                      cursor: 'pointer',
                      width: '65%',   // 피드 하나의 전체 가로 크기
                      mx: 'auto'      // 가운데 정렬
                    }}
                    onClick={() => handleClickOpen(feed)}
                  >
                    {/* 아바타 + 닉네임 영역 (카드 위) */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mb: 1,
                        px: 1
                      }}
                    >
                      <Avatar sx={{ bgcolor: '#2563eb' }}>
                        {feed.userName
                          ? feed.userName.charAt(0).toUpperCase()
                          : 'U'}
                      </Avatar>
                      <Box sx={{ ml: 1.5 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{ color: '#111827', fontWeight: 600 }}
                        >
                          {feed.userName || '키덜트 유저'}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: '#6b7280' }}
                        >
                          @{feed.userId}
                        </Typography>
                      </Box>
                    </Box>

                    {/* 카드(내용 + 이미지) 영역 */}
                    <Card
                      sx={{
                        backgroundColor: '#ffffff',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 16px rgba(15,23,42,0.08)',
                        border: '1px solid #e5e7eb',
                        display: 'flex',
                        flexDirection: 'column',
                        '&:hover': {
                          backgroundColor: '#f9fafb'
                        }
                      }}
                    >
                      {/* 이미지 영역 */}
                      {feed.imgPath && (
                        <CardMedia
                          component="img"
                          image={getImgUrl(feed.imgPath)}
                          alt={feed.imgName}
                          sx={{
                            width: '100%',
                            height: 'auto',          // 이미지 비율 유지
                            objectFit: 'contain',    // 이미지가 잘리지 않도록
                            borderBottom: '1px solid #e5e7eb',
                            backgroundColor: '#000000' // 필요 없으면 제거
                          }}
                        />
                      )}

                      {/* 내용 영역 */}
                      <CardContent sx={{ backgroundColor: '#ffffff', pb: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#111827',
                            whiteSpace: 'pre-wrap'
                          }}
                        >
                          {feed.content}
                        </Typography>
                      </CardContent>

                      {/* 피드 액션 아이콘 영역 (댓글 / 좋아요 / 보관하기) */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2.5,
                          px: 2,
                          pb: 1.5,
                          pt: 0.5,
                          color: '#6b7280'
                        }}
                      >
                        {/* 댓글 아이콘 - 클릭 시 상세 모달(댓글 포함) 열기 */}
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation(); // 카드 전체 클릭 이벤트 막기
                            handleClickOpen(feed);
                          }}
                        >
                          <ChatBubbleOutlineIcon sx={{ fontSize: 20 }} />
                        </IconButton>

                        {/* 좋아요 아이콘 - 나중에 로직 구현, 현재는 클릭만 처리 */}
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('like click', feed.feedId);
                          }}
                        >
                          <FavoriteBorderIcon sx={{ fontSize: 20 }} />
                        </IconButton>

                        {/* 보관하기 아이콘 - 나중에 로직 구현, 현재는 클릭만 처리 */}
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('bookmark click', feed.feedId);
                          }}
                        >
                          <BookmarkBorderIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                      </Box>
                    </Card>
                  </Box>
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

          {/* 오른쪽 프로필 카드 영역 */}
          <Box
            sx={{
              flex: 1,
              maxWidth: 280,
              ml: 2,
              display: { xs: 'none', md: 'block' }
            }}
          >
            {/* 상단 검색창 */}
            <TextField
              size="small"
              placeholder="검색"
              fullWidth
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{
                mb: 2,
                backgroundColor: '#ffffff',
                '& .MuiOutlinedInput-root': {
                  borderRadius: '999px'
                }
              }}
            />

            <Paper
              elevation={3}
              sx={{
                borderRadius: '18px',
                padding: 2.5,
                textAlign: 'center',
                backgroundColor: '#ffffff',
                boxShadow: '0 8px 24px rgba(15,23,42,0.12)'
              }}
            >
              <Avatar
                alt="프로필 이미지"
                src={
                  user?.profileImgPath
                    ? 'http://localhost:3010' + user.profileImgPath
                    : 'http://localhost:3010/uploads/userDefault.png'
                }
                sx={{
                  width: 90,
                  height: 90,
                  margin: '0 auto',
                  mb: 2,
                  border: '2px solid #e5e7eb',
                  boxSizing: 'border-box'
                }}
              />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {user?.userName || '키덜트 유저'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#6b7280', mb: 2 }}>
                @{user?.userId || 'user'}
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  color: '#6b7280',
                  mt: 1,
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '24px'
                }}
              >
                <span>팔로잉</span>
                <span>팔로워</span>
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '32px'
                }}
              >
                <span>{user?.following || 0}</span>
                <span>{user?.follower || 0}</span>
              </Typography>
            </Paper>

            {/* 하단 게시하기 버튼 */}
            <Button
              variant="contained"
              onClick={handleOpenWrite}
              sx={{
                mt: 3,
                width: '100%',
                borderRadius: '999px',
                backgroundColor: '#111827',
                color: '#ffffff',
                paddingY: 1.3,
                fontWeight: 700,
                fontSize: '0.95rem',
                textTransform: 'none',
                boxShadow: '0 16px 40px rgba(15,23,42,0.35)',
                '&:hover': {
                  backgroundColor: '#020617'
                }
              }}
            >
              게시하기
            </Button>
          </Box>
        </Box>
      </Box>

      {/* 피드 작성 모달 */}
      <Dialog
        open={writeOpen}
        onClose={handleCloseWrite}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: '24px',
            paddingY: 1,
            backgroundColor: '#ffffff'
          }
        }}
      >
        <DialogTitle
          sx={{
            fontSize: '0.95rem',
            fontWeight: 600,
            paddingX: 3,
            paddingY: 1,
            borderBottom: '1px solid #e5e7eb'
          }}
        >
          새 피드 작성
          <IconButton
            edge="end"
            onClick={handleCloseWrite}
            aria-label="close"
            sx={{ position: 'absolute', right: 12, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent
          sx={{
            paddingX: 3,
            paddingTop: 2,
            paddingBottom: 1
          }}
        >
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Avatar
              alt="프로필 이미지"
              src={
                user?.profileImgPath
                  ? 'http://localhost:3010' + user.profileImgPath
                  : 'http://localhost:3010/uploads/userDefault.png'
              }
            >
              {user?.userName
                ? user.userName.charAt(0).toUpperCase()
                : 'U'}
            </Avatar>

            <Box sx={{ flex: 1 }}>
              <Typography
                variant="subtitle2"
                sx={{ mb: 1, fontWeight: 600 }}
              >
                {user?.userName || '키덜트 유저'}
              </Typography>

              <TextField
                placeholder="제목을 입력하세요."
                fullWidth
                variant="standard"
                value={writeTitle}
                onChange={(e) => setWriteTitle(e.target.value)}
                sx={{ mb: 2 }}
              />

              <TextField
                placeholder="무슨 일이 일어나고 있나요?"
                fullWidth
                multiline
                minRows={3}
                value={writeContent}
                onChange={(e) => setWriteContent(e.target.value)}
                variant="standard"
              />
            </Box>
          </Box>

          {/* 이미지 업로드 영역 */}
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" sx={{ mb: 1, color: '#6b7280' }}>
              이미지 첨부  최대 5장까지 업로드 가능합니다.
            </Typography>
            <Button
              component="label"
              variant="outlined"
              sx={{
                textTransform: 'none',
                borderRadius: '999px',
                paddingX: 2
              }}
            >
              이미지 선택
              <input
                type="file"
                hidden
                multiple
                accept="image/*"
                onChange={handleWriteFileChange}
              />
            </Button>
            {writeFiles.length > 0 && (
              <Typography
                variant="body2"
                sx={{ mt: 1, color: '#4b5563' }}
              >
                선택된 파일  {writeFiles.length}개
              </Typography>
            )}
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            paddingX: 3,
            paddingBottom: 2,
            borderTop: '1px solid #e5e7eb'
          }}
        >
          <Button onClick={handleCloseWrite} sx={{ textTransform: 'none' }}>
            취소
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitWrite}
            sx={{
              borderRadius: '999px',
              paddingX: 3,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            게시하기
          </Button>
        </DialogActions>
      </Dialog>

      {/* 피드 상세 모달 */}
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="lg"
        PaperProps={{
          sx: {
            backgroundColor: '#ffffff',
            color: '#111827',
            borderRadius: '20px',
            border: '1px solid #e5e7eb'
          }
        }}
      >
        <DialogTitle
          sx={{
            borderBottom: '1px solid #e5e7eb',
            pr: 6
          }}
        >
          {selectedFeed?.title || '덕질 기록 상세'}
          <IconButton
            edge="end"
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
                  border: '1px solid #e5e7eb',
                  mb: 2
                }}
              >
                <img
                  src={getImgUrl(selectedFeed.imgPath)}
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
              borderLeft: { md: '1px solid #e5e7eb' },
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
                    <Avatar sx={{ bgcolor: '#2563eb' }}>
                      {comment.id.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography
                        variant="body2"
                        sx={{ color: '#111827' }}
                      >
                        {comment.text}
                      </Typography>
                    }
                    secondary={
                      <Typography
                        variant="caption"
                        sx={{ color: '#6b7280' }}
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
              InputLabelProps={{ style: { color: '#6b7280' } }}
              InputProps={{
                style: {
                  color: '#111827',
                  backgroundColor: '#f9fafb',
                  borderRadius: 10
                }
              }}
            />
            <Button
              variant="contained"
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
            borderTop: '1px solid #e5e7eb',
            padding: 2
          }}
        >
          <Button
            onClick={() => {
              console.log(selectedFeed);
              fetch('http://localhost:3010/feed/' + selectedFeed.feedId, {
                method: 'DELETE',
                headers: {
                  Authorization: 'Bearer ' + localStorage.getItem('token')
                }
              })
                .then((res) => res.json())
                .then((data) => {
                  alert('삭제되었습니다.');
                  setOpen(false);
                  fnFeeds();
                });
            }}
            variant="contained"
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
            sx={{
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            닫기
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default Feed;
