// src/components/MyPage.js
import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Avatar,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  TextField
} from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import ArticleIcon from '@mui/icons-material/Article';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { jwtDecode } from "jwt-decode";
import { useNavigate, useParams } from 'react-router-dom';

function getAvatarRingStyle(status) {
  const s = (status || 'c').toLowerCase();

  let backgroundImage =
    'conic-gradient(#111827, #4b5563, #111827, #9ca3af, #111827)';
  let boxShadow =
    '0 0 0 1px rgba(15,23,42,0.7), 0 0 10px rgba(15,23,42,0.4)';

  if (s === 'b') {
    backgroundImage =
      'conic-gradient(#3b1f0f, #b87333, #f6d6a4, #b87333, #3b1f0f)';
    boxShadow =
      '0 0 0 1px rgba(120,53,15,0.7), 0 0 12px rgba(248,180,82,0.4)';
  } else if (s === 's') {
    backgroundImage =
      'conic-gradient(#4b5563, #e5e7eb, #f9fafb, #d1d5db, #4b5563)';
    boxShadow =
      '0 0 0 1px rgba(148,163,184,0.7), 0 0 12px rgba(209,213,219,0.4)';
  } else if (s === 'g') {
    backgroundImage =
      'conic-gradient(#7c2d12, #facc15, #fef9c3, #fbbf24, #7c2d12)';
    boxShadow =
      '0 0 0 1px rgba(146,64,14,0.7), 0 0 12px rgba(250,204,21,0.4)';
  } else if (s === 'e') {
    backgroundImage =
      'conic-gradient(#064e3b, #22c55e, #a7f3d0, #10b981, #064e3b)';
    boxShadow =
      '0 0 0 1px rgba(6,95,70,0.7), 0 0 12px rgba(45,212,191,0.4)';
  } else if (s === 'a') {
    backgroundImage =
      'conic-gradient(#4c1d95, #a855f7, #e9d5ff, #8b5cf6, #4c1d95)';
    boxShadow =
      '0 0 0 1px rgba(76,29,149,0.7), 0 0 12px rgba(168,85,247,0.4)';
  }

  return {
    width: 88,
    height: 88,
    borderRadius: '50%',
    padding: '2px',
    backgroundImage,
    boxShadow,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  };
}


/**
 * 날짜 표시 함수
 */
function formatDateTime(value) {
  if (!value) return '';

  const date = new Date(value);
  if (isNaN(date.getTime())) return value;

  const pad = (n) => String(n).padStart(2, '0');

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());

  const today = new Date();
  const isSameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  return isSameDay
    ? `${year}-${month}-${day} ${hour}:${minute}`
    : `${year}-${month}-${day}`;
}

function MyPage() {
  const { userId: paramUserId } = useParams();
  const [loginUserId, setLoginUserId] = useState(null);
  const [user, setUser] = useState();
  const [feeds, setFeeds] = useState([]);
  const [viewType, setViewType] = useState('image');

  const [isMyPage, setIsMyPage] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  const [openFollowers, setOpenFollowers] = useState(false);
  const [openFollowing, setOpenFollowing] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);

  const [openProfileEdit, setOpenProfileEdit] = useState(false);
  const [editUserName, setEditUserName] = useState('');
  const [profileFile, setProfileFile] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedFeed, setSelectedFeed] = useState(null);
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);

  const [feedImageIndex, setFeedImageIndex] = useState({});

  const navigate = useNavigate();

  function fnGetUser() {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("로그인 후 이용해주세요.");
      navigate("/");
      return;
    }

    const decoded = jwtDecode(token);
    const loginId = decoded.userId;
    setLoginUserId(loginId);

    const targetUserId = paramUserId || loginId;
    setIsMyPage(targetUserId === loginId);

    fetch("http://localhost:3010/user/" + targetUserId, {
      headers: { Authorization: "Bearer " + token }
    })
      .then(res => res.json())
      .then(data => {
        setUser(data.user);
        setFeeds(data.feeds || []);
        setIsFollowing(data.isFollowing || false);
        setFeedImageIndex({});
      })
      .catch(err => console.log(err));
  }

  useEffect(() => {
    fnGetUser();
  }, [paramUserId]);

  const userStatus = (user?.status || 'c').toLowerCase();
  const avatarRingStyle = getAvatarRingStyle(userStatus);

  const activityCount = user?.feedCnt ?? feeds.length;
  const canChangeProfileImage = ['b', 's', 'g', 'e', 'a'].includes(userStatus);

  const hasAnyImage = (feed) => {
    const hasList = Array.isArray(feed.images) && feed.images.length > 0;
    return hasList || !!feed.imgPath;
  };

  const filteredFeeds = feeds.filter(feed =>
    viewType === 'image' ? hasAnyImage(feed) : !hasAnyImage(feed)
  );

  const getFeedCurrentIndex = (feedId, length) => {
    if (!length || length <= 0) return 0;
    const idx = feedImageIndex[feedId];
    return idx == null || idx < 0 || idx >= length ? 0 : idx;
  };

  const handlePrevFeedImage = (e, feed) => {
    e.stopPropagation();
    if (!feed || !Array.isArray(feed.images) || feed.images.length <= 1) return;
    const len = feed.images.length;
    setFeedImageIndex(prev => {
      const current = prev[feed.feedId] ?? 0;
      const next = (current - 1 + len) % len;
      return { ...prev, [feed.feedId]: next };
    });
  };

  const handleNextFeedImage = (e, feed) => {
    e.stopPropagation();
    if (!feed || !Array.isArray(feed.images) || feed.images.length <= 1) return;
    const len = feed.images.length;
    setFeedImageIndex(prev => {
      const current = prev[feed.feedId] ?? 0;
      const next = (current + 1) % len;
      return { ...prev, [feed.feedId]: next };
    });
  };

  const handleToggleFollow = async () => {
    if (!user) return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("로그인 후 이용해주세요.");
      navigate("/");
      return;
    }

    try {
      const res = await fetch(
        "http://localhost:3010/user/" + user.userId + "/follow",
        {
          method: "POST",
          headers: { Authorization: "Bearer " + token }
        }
      );

      const data = await res.json();
      if (data.result === "success") {
        setIsFollowing(data.isFollowing);
        setUser(prev =>
          prev ? { ...prev, follower: data.followerCount } : prev
        );
      } else {
        alert("팔로우 처리 중 오류가 발생했습니다.");
      }
    } catch (e) {
      console.log(e);
      alert("팔로우 처리 중 오류가 발생했습니다.");
    }
  };

  const fetchFollowers = () => {
    if (!user) return;
    fetch(`http://localhost:3010/user/${user.userId}/followers`)
      .then(res => res.json())
      .then(data => {
        setFollowers(data.list || []);
        setOpenFollowers(true);
      })
      .catch(err => console.log(err));
  };

  const fetchFollowing = () => {
    if (!user) return;
    fetch(`http://localhost:3010/user/${user.userId}/following`)
      .then(res => res.json())
      .then(data => {
        setFollowing(data.list || []);
        setOpenFollowing(true);
      })
      .catch(err => console.log(err));
  };

  const handleOpenProfileEdit = () => {
    if (!user) return;
    setEditUserName(user.userName || '');
    setProfileFile(null);
    setProfilePreview(
      user.profileImgPath
        ? "http://localhost:3010" + user.profileImgPath
        : null
    );
    setOpenProfileEdit(true);
  };

  const handleCloseProfileEdit = () => {
    setOpenProfileEdit(false);
    setProfileFile(null);
    setProfilePreview(null);
  };

  const handleProfileFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileFile(file);
    setProfilePreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("로그인 후 이용해주세요.");
      navigate("/");
      return;
    }

    if (!editUserName.trim()) {
      alert("닉네임을 입력해주세요.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("userName", editUserName.trim());

      if (canChangeProfileImage && profileFile) {
        formData.append("profileImg", profileFile);
      }

      const res = await fetch("http://localhost:3010/user/profile", {
        method: "PUT",
        headers: { Authorization: "Bearer " + token },
        body: formData
      });

      const data = await res.json();

      if (data.result === "success") {
        setUser(prev =>
          prev
            ? {
              ...prev,
              userName: data.user?.userName || editUserName.trim(),
              profileImgPath: data.user?.profileImgPath ?? prev.profileImgPath
            }
            : prev
        );

        handleCloseProfileEdit();
      } else {
        alert(data.message || "프로필 수정 중 오류가 발생했습니다.");
      }
    } catch (e) {
      console.log(e);
      alert("프로필 수정 중 오류가 발생했습니다.");
    }
  };

  const handleOpenDetail = (feed) => {
    setSelectedFeed(feed);
    setSelectedImgIndex(0);
    setDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedFeed(null);
    setSelectedImgIndex(0);
  };

  const handlePrevSelectedImage = () => {
    if (
      !selectedFeed ||
      !Array.isArray(selectedFeed.images) ||
      selectedFeed.images.length <= 1
    )
      return;

    const len = selectedFeed.images.length;
    setSelectedImgIndex(prev => (prev - 1 + len) % len);
  };

  const handleNextSelectedImage = () => {
    if (
      !selectedFeed ||
      !Array.isArray(selectedFeed.images) ||
      selectedFeed.images.length <= 1
    )
      return;

    const len = selectedFeed.images.length;
    setSelectedImgIndex(prev => (prev + 1) % len);
  };

  return (
    <Box
      sx={{
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
        py: 4
      }}
    >
      <Container maxWidth="lg">
        <Box display="flex" flexDirection="column" alignItems="center">
          {/* 헤더 */}
          <Box
            sx={{
              width: "100%",
              maxWidth: 1100,
              borderBottom: "1px solid #e5e7eb",
              pb: 3,
              mb: 4
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", columnGap: 4 }}>

              {/* 메탈릭 링 + 아바타 */}
              <Box sx={avatarRingStyle}>
                <Avatar
                  alt="프로필"
                  src={
                    user?.profileImgPath
                      ? "http://localhost:3010" + user.profileImgPath
                      : "http://localhost:3010/uploads/userDefault.png"
                  }
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    boxSizing: "border-box",
                    border: "2px solid rgba(255,255,255,0.75)",
                    backgroundColor: "#020617"
                  }}
                />
              </Box>

              {/* 이름 + 소개 */}
              <Box sx={{ flex: 1 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    columnGap: 2,
                    mb: 1
                  }}
                >
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    {user?.userName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    @{user?.userId}
                  </Typography>

                  {!isMyPage && user && (
                    <Button
                      variant={isFollowing ? "outlined" : "contained"}
                      size="small"
                      onClick={handleToggleFollow}
                      sx={{
                        textTransform: "none",
                        borderRadius: "999px",
                        ml: 2
                      }}
                    >
                      {isFollowing ? "팔로우 취소" : "팔로우 하기"}
                    </Button>
                  )}

                  {isMyPage && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleOpenProfileEdit}
                      sx={{
                        textTransform: "none",
                        borderRadius: "999px",
                        ml: 2
                      }}
                    >
                      프로필 수정
                    </Button>
                  )}
                </Box>

                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                  내 소개
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user?.intro || "간단한 소개글을 작성해보세요."}
                </Typography>

                {isMyPage && (
                  <Typography
                    variant="caption"
                    sx={{ mt: 0.5, display: "block", color: "#6b7280" }}
                  >
                    활동 글 {activityCount}개 · 브론즈 등급부터 프로필 사진을 등록할 수 있어요.
                  </Typography>
                )}
              </Box>

              {/* 팔로워/팔로잉/게시물 */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  columnGap: 4,
                  ml: 2
                }}
              >
                <Box sx={{ textAlign: "center", cursor: "pointer" }} onClick={fetchFollowers}>
                  <Typography variant="subtitle2" color="text.secondary">
                    팔로워
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {user?.follower ?? 0}
                  </Typography>
                </Box>

                <Box sx={{ textAlign: "center", cursor: "pointer" }} onClick={fetchFollowing}>
                  <Typography variant="subtitle2" color="text.secondary">
                    팔로잉
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {user?.following ?? 0}
                  </Typography>
                </Box>

                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    게시물
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {user?.feedCnt ?? feeds.length}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* 사진/텍스트 토글 */}
          <Box
            sx={{
              width: "100%",
              maxWidth: 1100,
              display: "flex",
              justifyContent: "flex-end",
              mb: 2,
              columnGap: 1.5
            }}
          >
            <Button
              onClick={() => setViewType("image")}
              startIcon={<ImageIcon sx={{ fontSize: 18 }} />}
              sx={{
                textTransform: "none",
                borderRadius: "999px",
                fontSize: "0.85rem",
                px: 1.8,
                py: 0.6,
                backgroundColor: viewType === "image" ? "#111827" : "transparent",
                color: viewType === "image" ? "#ffffff" : "#6b7280",
                border: "1px solid",
                borderColor: viewType === "image" ? "#111827" : "#d1d5db"
              }}
            >
              사진
            </Button>

            <Button
              onClick={() => setViewType("text")}
              startIcon={<ArticleIcon sx={{ fontSize: 18 }} />}
              sx={{
                textTransform: "none",
                borderRadius: "999px",
                fontSize: "0.85rem",
                px: 1.8,
                py: 0.6,
                backgroundColor: viewType === "text" ? "#111827" : "transparent",
                color: viewType === "text" ? "#ffffff" : "#6b7280",
                border: "1px solid",
                borderColor: viewType === "text" ? "#111827" : "#d1d5db"
              }}
            >
              텍스트
            </Button>
          </Box>

          {/* 피드 */}
          <Box sx={{ width: "100%", maxWidth: 1100 }}>
            <Grid container spacing={2}>
              {filteredFeeds.map((feed) => {
                const hasImages = Array.isArray(feed.images) && feed.images.length > 0;

                let cardImgSrc = "";
                let cardImgAlt = "";

                if (hasImages) {
                  const len = feed.images.length;
                  const idx = getFeedCurrentIndex(feed.feedId, len);
                  const imgObj = feed.images[idx];
                  if (imgObj && imgObj.imgPath) {
                    cardImgSrc = "http://localhost:3010" + imgObj.imgPath;
                    cardImgAlt = imgObj.imgName || feed.title;
                  }
                } else if (feed.imgPath) {
                  cardImgSrc = "http://localhost:3010" + feed.imgPath;
                  cardImgAlt = feed.title;
                }

                return (
                  <Grid item xs={12} sm={6} md={4} key={feed.feedId}>
                    <Card
                      sx={{
                        borderRadius: "18px",
                        cursor: "pointer"
                      }}
                      onClick={() => handleOpenDetail(feed)}
                    >
                      {cardImgSrc && (
                        <Box sx={{ position: "relative" }}>
                          <CardMedia component="img" height="220" image={cardImgSrc} alt={cardImgAlt} />

                          {hasImages && feed.images.length > 1 && (
                            <>
                              <Button
                                onClick={(e) => handlePrevFeedImage(e, feed)}
                                sx={{
                                  minWidth: 0,
                                  position: "absolute",
                                  top: "50%",
                                  left: 6,
                                  transform: "translateY(-50%)",
                                  borderRadius: "999px",
                                  padding: 0.3,
                                  backgroundColor: "rgba(0,0,0,0.45)"
                                }}
                              >
                                <ArrowBackIosNewIcon sx={{ fontSize: 16, color: "#ffffff" }} />
                              </Button>

                              <Button
                                onClick={(e) => handleNextFeedImage(e, feed)}
                                sx={{
                                  minWidth: 0,
                                  position: "absolute",
                                  top: "50%",
                                  right: 6,
                                  transform: "translateY(-50%)",
                                  borderRadius: "999px",
                                  padding: 0.3,
                                  backgroundColor: "rgba(0,0,0,0.45)"
                                }}
                              >
                                <ArrowForwardIosIcon sx={{ fontSize: 16, color: "#ffffff" }} />
                              </Button>

                              <Box
                                sx={{
                                  position: "absolute",
                                  bottom: 6,
                                  right: 8,
                                  backgroundColor: "rgba(0,0,0,0.5)",
                                  borderRadius: "999px",
                                  paddingX: 0.8,
                                  paddingY: 0.2
                                }}
                              >
                                <Typography variant="caption" sx={{ color: "#f9fafb" }}>
                                  {getFeedCurrentIndex(feed.feedId, feed.images.length) + 1} /{" "}
                                  {feed.images.length}
                                </Typography>
                              </Box>
                            </>
                          )}
                        </Box>
                      )}

                      <CardContent sx={{ p: 2 }}>
                        <Typography variant="subtitle1" sx={{ mb: 0.5 }} noWrap>
                          {feed.title}
                        </Typography>

                        <Typography variant="body2" color="text.secondary" noWrap>
                          {feed.content}
                        </Typography>

                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                          {formatDateTime(feed.cdatetime)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}

              {filteredFeeds.length === 0 && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    선택한 유형의 게시물이 없습니다.
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        </Box>
      </Container>

      {/* 상세 모달 */}
      <Dialog open={detailOpen} onClose={handleCloseDetail} fullWidth maxWidth="md">
        <DialogTitle>{selectedFeed?.title || "게시글 상세보기"}</DialogTitle>
        <DialogContent dividers>
          {selectedFeed && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {(selectedFeed.images && Array.isArray(selectedFeed.images) && selectedFeed.images.length > 0) ||
                selectedFeed.imgPath ? (
                <Box
                  sx={{
                    borderRadius: 2,
                    overflow: "hidden",
                    border: "1px solid #e5e7eb",
                    position: "relative"
                  }}
                >
                  {selectedFeed.images && selectedFeed.images.length > 0 ? (
                    <>
                      <img
                        src={"http://localhost:3010" + selectedFeed.images[selectedImgIndex].imgPath}
                        alt={selectedFeed.images[selectedImgIndex].imgName || selectedFeed.title}
                        style={{ width: "100%", display: "block" }}
                      />

                      {selectedFeed.images.length > 1 && (
                        <>
                          <Button
                            onClick={handlePrevSelectedImage}
                            sx={{
                              minWidth: 0,
                              position: "absolute",
                              top: "50%",
                              left: 6,
                              transform: "translateY(-50%)",
                              borderRadius: "999px",
                              padding: 0.3,
                              backgroundColor: "rgba(0,0,0,0.45)"
                            }}
                          >
                            <ArrowBackIosNewIcon sx={{ fontSize: 18, color: "#ffffff" }} />
                          </Button>

                          <Button
                            onClick={handleNextSelectedImage}
                            sx={{
                              minWidth: 0,
                              position: "absolute",
                              top: "50%",
                              right: 6,
                              transform: "translateY(-50%)",
                              borderRadius: "999px",
                              padding: 0.3,
                              backgroundColor: "rgba(0,0,0,0.45)"
                            }}
                          >
                            <ArrowForwardIosIcon sx={{ fontSize: 18, color: "#ffffff" }} />
                          </Button>

                          <Box
                            sx={{
                              position: "absolute",
                              bottom: 6,
                              right: 8,
                              backgroundColor: "rgba(0,0,0,0.5)",
                              borderRadius: "999px",
                              paddingX: 0.8,
                              paddingY: 0.2
                            }}
                          >
                            <Typography variant="caption" sx={{ color: "#f9fafb" }}>
                              {selectedImgIndex + 1} / {selectedFeed.images.length}
                            </Typography>
                          </Box>
                        </>
                      )}
                    </>
                  ) : (
                    selectedFeed.imgPath && (
                      <img
                        src={"http://localhost:3010" + selectedFeed.imgPath}
                        alt={selectedFeed.title}
                        style={{ width: "100%", display: "block" }}
                      />
                    )
                  )}
                </Box>
              ) : null}

              <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                {selectedFeed.content}
              </Typography>

              {selectedFeed.hash && (
                <Typography variant="body2" sx={{ color: "#2563eb", whiteSpace: "pre-wrap" }}>
                  {selectedFeed.hash}
                </Typography>
              )}

              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                작성일 {formatDateTime(selectedFeed.cdatetime)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetail}>닫기</Button>
        </DialogActions>
      </Dialog>

      {/* 팔로워 모달 */}
      <Dialog open={openFollowers} onClose={() => setOpenFollowers(false)} fullWidth maxWidth="xs">
        <DialogTitle>팔로워</DialogTitle>
        <DialogContent dividers>
          {followers.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              아직 팔로워가 없습니다.
            </Typography>
          )}
          <List>
            {followers.map((u) => (
              <ListItem
                button
                key={u.userId}
                onClick={() => {
                  setOpenFollowers(false);
                  navigate("/user/" + u.userId);
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    src={
                      u.profileImgPath
                        ? "http://localhost:3010" + u.profileImgPath
                        : "http://localhost:3010/uploads/userDefault.png"
                    }
                  />
                </ListItemAvatar>
                <ListItemText primary={u.userName} secondary={"@" + u.userId} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFollowers(false)}>닫기</Button>
        </DialogActions>
      </Dialog>

      {/* 팔로잉 모달 */}
      <Dialog open={openFollowing} onClose={() => setOpenFollowing(false)} fullWidth maxWidth="xs">
        <DialogTitle>팔로잉</DialogTitle>
        <DialogContent dividers>
          {following.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              아직 팔로우하는 유저가 없습니다.
            </Typography>
          )}
          <List>
            {following.map((u) => (
              <ListItem
                button
                key={u.userId}
                onClick={() => {
                  setOpenFollowing(false);
                  navigate("/user/" + u.userId);
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    src={
                      u.profileImgPath
                        ? "http://localhost:3010" + u.profileImgPath
                        : "http://localhost:3010/uploads/userDefault.png"
                    }
                  />
                </ListItemAvatar>
                <ListItemText primary={u.userName} secondary={"@" + u.userId} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFollowing(false)}>닫기</Button>
        </DialogActions>
      </Dialog>

      {/* 프로필 수정 모달 */}
      <Dialog open={openProfileEdit} onClose={handleCloseProfileEdit} fullWidth maxWidth="xs">
        <DialogTitle>프로필 수정</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="닉네임"
              fullWidth
              value={editUserName}
              onChange={(e) => setEditUserName(e.target.value)}
            />

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                프로필 이미지
              </Typography>

              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>

                {/* 메탈릭 링 적용된 모달 Avatar */}
                <Box sx={avatarRingStyle}>
                  <Avatar
                    src={
                      profilePreview ||
                      (user?.profileImgPath
                        ? "http://localhost:3010" + user.profileImgPath
                        : "http://localhost:3010/uploads/userDefault.png")
                    }
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: "50%",
                      boxSizing: "border-box",
                      border: "2px solid rgba(255,255,255,0.75)",
                      backgroundColor: "#020617"
                    }}
                  />
                </Box>

                <Box>
                  <Button
                    component="label"
                    variant="outlined"
                    size="small"
                    disabled={!canChangeProfileImage}
                    sx={{ textTransform: "none", borderRadius: "999px" }}
                  >
                    이미지 선택
                    <input type="file" hidden accept="image/*" onChange={handleProfileFileChange} />
                  </Button>

                  <Typography variant="caption" sx={{ display: "block", mt: 0.5, color: "#6b7280" }}>
                    {canChangeProfileImage
                      ? "프로필 사진을 변경할 수 있습니다."
                      : "브론즈 등급(b) 이상부터 프로필 사진을 등록할 수 있어요."}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseProfileEdit}>취소</Button>
          <Button variant="contained" onClick={handleSaveProfile}>
            저장
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default MyPage;
