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
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import FavoriteIcon from '@mui/icons-material/Favorite';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import { jwtDecode } from 'jwt-decode';
import { useNavigate, useLocation } from 'react-router-dom';

// 활동 등급에 따른 프로필 테두리 색상
function getGradeBorderColor(feedCnt) {
  const count = feedCnt || 0;

  if (count >= 40) {
    // 다이아
    return '#38bdf8';
  } else if (count >= 30) {
    // 금색
    return '#facc15';
  } else if (count >= 20) {
    // 은색
    return '#e5e7eb';
  } else if (count >= 10) {
    // 브론즈
    return '#b45309';
  }
  // 기본 검정
  return '#111827';
}

// 배열 섞기 (파도타기용 랜덤 정렬)
function shuffleArray(arr) {
  const copied = [...arr];
  for (let i = copied.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }
  return copied;
}

function Feed() {
  const navigate = useNavigate();
  const location = useLocation();

  // 파도타기 모드 여부: /feed 경로일 때
  const isSurfMode = location.pathname === '/feed';

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

  // 실제로 적용된 검색 키워드 (검색 결과 표시용)
  const [searchKeyword, setSearchKeyword] = useState('');

  // 게시하기 모달용 상태
  const [writeOpen, setWriteOpen] = useState(false);
  const [writeTitle, setWriteTitle] = useState('');
  const [writeContent, setWriteContent] = useState('');
  const [writeHash, setWriteHash] = useState('');
  const [writeFiles, setWriteFiles] = useState([]);

  // 파도 애니메이션 표시 여부
  const [showWave, setShowWave] = useState(false);

  // 상단 핫한 피드 카드 목록 (하드코딩 5장)
  const hotFeedList = [
    {
      id: 1,
      title: '오늘의 핫한 카드를 확인해 보세요!',
      image: 'http://localhost:3010/uploads/hotCard.png'
    },
    {
      id: 2,
      title: '키덜트 유저들이 가장 많이 본 피드',
      image: 'http://localhost:3010/uploads/han_idk.png'
    },
    {
      id: 3,
      title: '이번 주 인기 급상승 피드',
      image: 'http://localhost:3010/uploads/hotIssue.png'
    },
    {
      id: 4,
      title: '도전 욕구를 자극하는 한정판 카드',
      image: 'http://localhost:3010/uploads/bestSellection.png'
    },
    {
      id: 5,
      title: '놓치기 아까운 이번 달 베스트 컬렉션',
      image: 'http://localhost:3010/uploads/dummy1.png'
    }
  ];

  // 현재 보여주는 핫 피드 인덱스
  const [hotIndex, setHotIndex] = useState(0);

  // offset 기준으로 카드 가져오기
  const getHotCard = (offset) => {
    if (hotFeedList.length === 0) return null;
    const len = hotFeedList.length;
    const index = (hotIndex + offset + len) % len;
    return hotFeedList[index];
  };

  // 오른쪽으로 넘기기
  const handleNextHot = () => {
    if (hotFeedList.length === 0) return;
    setHotIndex((prev) => (prev + 1) % hotFeedList.length);
  };

  // 왼쪽으로 넘기기
  const handlePrevHot = () => {
    if (hotFeedList.length === 0) return;
    setHotIndex((prev) => {
      const len = hotFeedList.length;
      return (prev - 1 + len) % len;
    });
  };

  // 피드 목록 조회
  function fnFeeds() {
    const token = localStorage.getItem('token');

    if (!token) {
      alert('로그인 후 이용해주세요.');
      navigate('/');
      return;
    }

    fetch('http://localhost:3010/feed/feedAll', {
      headers: {
        Authorization: 'Bearer ' + token
      }
    })
      .then((res) => res.json())
      .then((data) => {
        console.log('feed list ==> ', data);
        const safeList = Array.isArray(data.list)
          ? data.list.filter((item) => item != null)
          : [];

        // 파도타기 모드면 랜덤 정렬, 아니면 알고리즘 순서 그대로
        if (isSurfMode) {
          const shuffled = shuffleArray(safeList);
          setFeeds(shuffled);
        } else {
          setFeeds(safeList);
        }

        setSearchKeyword('');
      })
      .catch((err) => {
        console.log(err);
      });
  }

  // 좋아요 토글
  const handleToggleLike = async (feedId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('로그인 후 이용해주세요.');
        return;
      }

      const res = await fetch(`http://localhost:3010/feed/${feedId}/like`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + token
        }
      });

      const data = await res.json();
      console.log('like toggle result ==> ', data);

      if (data.result === 'success') {
        setFeeds((prev) =>
          prev.map((f) =>
            f.feedId === feedId
              ? { ...f, likeCount: data.likeCount, liked: data.liked }
              : f
          )
        );
      } else {
        alert('좋아요 처리 중 오류가 발생했습니다.');
      }
    } catch (e) {
      console.log(e);
      alert('좋아요 처리 중 오류가 발생했습니다.');
    }
  };

  // 북마크 토글
  const handleToggleBookmark = async (feedId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('로그인 후 이용해주세요.');
        return;
      }

      const res = await fetch(
        `http://localhost:3010/bookmark/toggle/${feedId}`,
        {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + token
          }
        }
      );

      const data = await res.json();
      console.log('bookmark toggle result ==> ', data);

      if (data.result === 'success') {
        setFeeds((prev) =>
          prev.map((f) =>
            f.feedId === feedId ? { ...f, bookmarked: data.bookmarked } : f
          )
        );
      } else {
        alert('북마크 처리 중 오류가 발생했습니다.');
      }
    } catch (e) {
      console.log(e);
      alert('북마크 처리 중 오류가 발생했습니다.');
    }
  };

  // 우측 프로필 카드용 유저 정보 조회
  function fnGetUser() {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwtDecode(token);

      fetch('http://localhost:3010/user/' + decoded.userId, {
        headers: {
          Authorization: 'Bearer ' + token
        }
      })
        .then((res) => res.json())
        .then((data) => {
          console.log('user ==> ', data);
          setUser(data.user);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }

  // 피드 검색
  function fnSearch() {
    const token = localStorage.getItem('token');

    if (!token) {
      alert('로그인 후 이용해주세요.');
      navigate('/');
      return;
    }

    const keyword = search.trim();

    // 검색어 없으면 전체 목록 다시 조회
    if (!keyword) {
      fnFeeds();
      return;
    }

    fetch('http://localhost:3010/feed/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      },
      body: JSON.stringify({ search: keyword })
    })
      .then((res) => res.json())
      .then((data) => {
        console.log('search result ==> ', data);
        const safeList = Array.isArray(data.list)
          ? data.list.filter((item) => item != null)
          : [];
        // 검색 결과는 그냥 검색 결과 순서대로 사용
        setFeeds(safeList);

        // 검색 성공 후, 어떤 키워드로 검색했는지 저장
        setSearchKeyword(keyword);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  // 사이트 처음 진입 & 모드 변경 시 피드 + 유저 정보 조회
  useEffect(() => {
    fnFeeds();
    fnGetUser();

    // 파도타기 모드일 때만 파도 애니메이션 실행
    if (isSurfMode) {
      setShowWave(true);
      const timer = setTimeout(() => {
        setShowWave(false);
      }, 1800); // 1.8초 정도

      return () => clearTimeout(timer);
    } else {
      setShowWave(false);
    }
  }, [isSurfMode]);

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
    setWriteHash('');
    setWriteFiles([]);
  };

  // 게시 모달에서 이미지 선택
  const handleWriteFileChange = (event) => {
    const selected = Array.from(event.target.files || []);
    const limited = selected.slice(0, 5);
    setWriteFiles(limited);
  };

  // 게시하기 저장
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
      formData.append('hash', writeHash); // 해시태그 추가

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

  // 선택된 피드의 닉네임 표시용
  const getSelectedUserName = () => {
    if (!selectedFeed) return '키덜트 유저';
    return selectedFeed.userName || '키덜트 유저';
  };

  const userBorderColor = getGradeBorderColor(user?.feedCnt);

  return (
    <>
      {/* 파도 애니메이션 오버레이 (파도타기 모드일 때만) */}
      {isSurfMode && showWave && (
        <Box
          sx={{
            position: 'fixed',
            left: 0,
            bottom: 0,
            width: '100%',
            height: '100vh',
            pointerEvents: 'none',
            zIndex: 1300,
            overflow: 'hidden'
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              bottom: '-10%',
              left: 0,
              width: '100%',
              height: '120%',
              background: 'linear-gradient(180deg, #38bdf8, #0ea5e9, #1d4ed8)',
              boxShadow: '0 -10px 40px rgba(15,23,42,0.45)',
              animation: 'waveUpDown 1.8s ease-out forwards',
              '@keyframes waveUpDown': {
                '0%': { transform: 'translateY(100%)' },
                '40%': { transform: 'translateY(-10%)' },
                '100%': { transform: 'translateY(120%)' }
              }
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: '18%',
                width: '100%',
                textAlign: 'center',
                color: '#e0f2fe',
                fontWeight: 700,
                fontSize: '1.1rem',
                letterSpacing: 1
              }}
            >
              🌊 파도타기 모드로 랜덤 피드를 탐색 중...
            </Box>
          </Box>
        </Box>
      )}

      {/* 메인 레이아웃 영역 */}
      <Box
        sx={{
          minHeight: '100vh',
          background: '#ffffffff', // 항상 흰색 배경
          paddingY: 4,
          paddingX: 3,
          display: 'flex',
          justifyContent: 'center',
          transition: 'background 0.6s ease'
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
            {/* 메인 피드 기준 폭(60%) */}
            <Box
              sx={{
                width: '60%',
                mx: 'auto'
              }}
            >
              {/* 상단 핫한 피드 카드 영역 */}
              {hotFeedList.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ mb: 1 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 700,
                        color: '#111827'
                      }}
                    >
                      오늘의 핫한 카드🔥
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      position: 'relative',
                      height: 170,
                      width: '100%',
                      maxWidth: '100%',
                      mx: 'auto'
                    }}
                  >
                    {/* 왼쪽 화살표 */}
                    <IconButton
                      size="small"
                      onClick={handlePrevHot}
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: -10,
                        transform: 'translateY(-50%)',
                        zIndex: 10,
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        '&:hover': {
                          backgroundColor: '#f3f4f6'
                        }
                      }}
                    >
                      <ArrowBackIosNewIcon sx={{ fontSize: 16 }} />
                    </IconButton>

                    {/* 오른쪽 화살표 */}
                    <IconButton
                      size="small"
                      onClick={handleNextHot}
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        right: -10,
                        transform: 'translateY(-50%)',
                        zIndex: 10,
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        '&:hover': {
                          backgroundColor: '#f3f4f6'
                        }
                      }}
                    >
                      <ArrowForwardIosIcon sx={{ fontSize: 16 }} />
                    </IconButton>

                    {/* 왼쪽 미리보기 카드 */}
                    {getHotCard(-1) && (
                      <Card
                        sx={{
                          position: 'absolute',
                          top: 22,
                          left: 0,
                          width: '55%',
                          height: '80%',
                          borderRadius: '18px',
                          backgroundColor: '#f3e8ff',
                          border: '1px solid #e5e7eb',
                          boxShadow: '0 6px 18px rgba(15,23,42,0.12)',
                          zIndex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          px: 2
                        }}
                      />
                    )}

                    {/* 오른쪽 미리보기 카드 */}
                    {getHotCard(1) && (
                      <Card
                        sx={{
                          opacity: 0.8,
                          position: 'absolute',
                          top: 22,
                          right: 0,
                          width: '55%',
                          height: '80%',
                          borderRadius: '18px',
                          backgroundColor: '#19042eda',
                          border: '1px solid #e5e7eb',
                          boxShadow: '0 6px 18px rgba(30, 54, 112, 0.12)',
                          zIndex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          px: 2
                        }}
                      />
                    )}

                    {/* 가운데 메인 카드 */}
                    {getHotCard(0) && (
                      <Card
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '72%',
                          height: '100%',
                          borderRadius: '18px',
                          overflow: 'hidden',
                          boxShadow: '0 10px 25px rgba(15,23,42,0.20)',
                          border: '1px solid #e5e7eb',
                          backgroundColor: '#ffffff',
                          zIndex: 2,
                          display: 'flex',
                          cursor: 'pointer'
                        }}
                        onClick={handleNextHot}
                      >
                        <Box sx={{ flex: 1.2, p: 2 }}>
                          <Typography
                            variant="caption"
                            sx={{ color: '#6b7280' }}
                          >
                            오늘의 추천 카드
                          </Typography>
                          <Typography
                            variant="subtitle1"
                            sx={{
                              mt: 1,
                              fontWeight: 700,
                              color: '#111827',
                              lineHeight: 1.4
                            }}
                          >
                            {getHotCard(0).title}
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            flex: 1,
                            borderLeft: '1px dashed #e5e7eb',
                            backgroundColor: '#f9fafb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {getHotCard(0).image ? (
                            <img
                              src={getHotCard(0).image}
                              alt={getHotCard(0).title}
                              style={{
                                maxWidth: '90%',
                                maxHeight: '90%',
                                objectFit: 'contain',
                                display: 'block'
                              }}
                            />
                          ) : (
                            <Typography
                              variant="caption"
                              style={{ color: '#9ca3af' }}
                            >
                              첨부 이미지 없음
                            </Typography>
                          )}
                        </Box>
                      </Card>
                    )}
                  </Box>
                </Box>
              )}

              {/* 타임라인 / 파도타기 타이틀 영역 */}
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="h6"
                  sx={{
                    color: '#111827',
                    fontWeight: 700
                  }}
                >
                  {isSurfMode ? '파도타기 🌊' : '타임라인'}
                </Typography>

                {/* 기본 안내 문구 */}
                {!searchKeyword && !isSurfMode && (
                  <Typography variant="body2" sx={{ color: '#6b7280' }}>
                    오늘의 새로운 소식들을 확인해보세요
                  </Typography>
                )}

                {/* 파도타기 모드 안내 문구 */}
                {!searchKeyword && isSurfMode && (
                  <Typography variant="body2" sx={{ color: '#2563eb', mt: 0.5 }}>
                    알고리즘을 끄고, 무작위로 떠다니는 피드를 보여주는 중입니다.
                  </Typography>
                )}

                {/* 검색 중일 때 안내 문구 */}
                {searchKeyword && (
                  <Typography
                    variant="body2"
                    sx={{ color: '#2563eb', mt: 0.5 }}
                  >
                    "{searchKeyword}" 검색 결과 피드입니다.
                  </Typography>
                )}
              </Box>

              {/* 피드 카드 리스트 (중앙 영역) */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {feeds && feeds.length > 0 ? (
                  feeds
                    .filter((feed) => feed != null)
                    .map((feed) => {
                      const displayName = feed.userName || '키덜트 유저';
                      const displayInitial = displayName
                        ? displayName.charAt(0).toUpperCase()
                        : 'U';

                      return (
                        <Box
                          key={feed.feedId}
                          sx={{
                            cursor: 'pointer'
                          }}
                          onClick={() => handleClickOpen(feed)}
                        >
                          {/* 아바타 + 닉네임 영역 */}
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              mb: 1,
                              px: 1
                            }}
                          >
                            <Avatar sx={{ bgcolor: '#2563eb' }}>
                              {displayInitial}
                            </Avatar>
                            <Box sx={{ ml: 1.5 }}>
                              <Typography
                                variant="subtitle2"
                                sx={{ color: '#111827', fontWeight: 600 }}
                              >
                                {displayName}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{ color: '#6b7280' }}
                              >
                                @{feed.userId}
                              </Typography>
                            </Box>
                          </Box>

                          {/* 카드 내용 영역 */}
                          <Card
                            sx={{
                              backgroundColor: isSurfMode
                                ? '#eff6ff'
                                : '#ffffff',
                              borderRadius: '16px',
                              overflow: 'hidden',
                              boxShadow: '0 4px 16px rgba(15,23,42,0.08)',
                              border: isSurfMode
                                ? '1px solid #bfdbfe'
                                : '1px solid #e5e7eb',
                              display: 'flex',
                              flexDirection: 'column',
                              '&:hover': {
                                backgroundColor: isSurfMode
                                  ? '#dbeafe'
                                  : '#f9fafb'
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
                                  height: 400,
                                  objectFit: 'cover',
                                  borderBottom: '1px solid #e5e7eb',
                                  backgroundColor: '#000000'
                                }}
                              />
                            )}

                            {/* 텍스트 + 해시태그 영역 */}
                            <CardContent
                              sx={{
                                backgroundColor: 'transparent',
                                pb: 1
                              }}
                            >
                              <Typography
                                variant="body2"
                                sx={{
                                  color: '#111827',
                                  whiteSpace: 'pre-wrap'
                                }}
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

                            {/* 액션 아이콘 영역 */}
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
                              {/* 댓글 아이콘 */}
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleClickOpen(feed);
                                }}
                              >
                                <ChatBubbleOutlineIcon sx={{ fontSize: 20 }} />
                              </IconButton>

                              {/* 좋아요 아이콘 */}
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleLike(feed.feedId);
                                }}
                              >
                                {feed.liked ? (
                                  <FavoriteIcon
                                    sx={{ fontSize: 20, color: '#e11d48' }}
                                  />
                                ) : (
                                  <FavoriteBorderIcon sx={{ fontSize: 20 }} />
                                )}
                              </IconButton>

                              {/* 보관하기 아이콘 */}
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleBookmark(feed.feedId);
                                }}
                              >
                                {feed.bookmarked ? (
                                  <BookmarkIcon
                                    sx={{ fontSize: 20, color: '#0ea5e9' }}
                                  />
                                ) : (
                                  <BookmarkBorderIcon sx={{ fontSize: 20 }} />
                                )}
                              </IconButton>
                            </Box>
                          </Card>
                        </Box>
                      );
                    })
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
          </Box>

          {/* 오른쪽 프로필 카드 영역 */}
          <Box
            sx={{
              flex: 1,
              maxWidth: 200,
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  fnSearch();
                }
              }}
              sx={{
                mb: 2,
                backgroundColor: '#ffffff',
                '& .MuiOutlinedInput-root': {
                  borderRadius: '999px',
                  '& fieldset': {
                    borderRadius: '999px'
                  }
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
                  width: 70,
                  height: 70,
                  margin: '0 auto',
                  mb: 2,
                  border: `2px solid ${userBorderColor}`,
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
              sx={{
                border: `2px solid ${userBorderColor}`
              }}
            >
              {user?.userName ? user.userName.charAt(0).toUpperCase() : 'U'}
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
                placeholder="내용을 작성해주세요."
                fullWidth
                multiline
                minRows={3}
                value={writeContent}
                onChange={(e) => setWriteContent(e.target.value)}
                variant="standard"
              />

              <TextField
                placeholder="#으로 구분하여 해시태그를 입력해주세요"
                fullWidth
                multiline
                value={writeHash}
                onChange={(e) => setWriteHash(e.target.value)}
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
              {getSelectedUserName()}
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {selectedFeed?.content}
            </Typography>

            {selectedFeed?.hash && (
              <Typography
                variant="body2"
                sx={{
                  color: '#2563eb',
                  mt: 1,
                  whiteSpace: 'pre-wrap'
                }}
              >
                {selectedFeed.hash}
              </Typography>
            )}
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
              if (!selectedFeed) return;

              fetch('http://localhost:3010/feed/' + selectedFeed.feedId, {
                method: 'DELETE',
                headers: {
                  Authorization: 'Bearer ' + localStorage.getItem('token')
                }
              })
                .then((res) => res.json())
                .then(() => {
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
