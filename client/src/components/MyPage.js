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
import { jwtDecode } from "jwt-decode";
import { useNavigate, useParams } from 'react-router-dom';

// 활동 등급에 따른 프로필 테두리 색상
function getGradeBorderColor(feedCnt) {
  const count = feedCnt || 0;

  if (count >= 40) return '#38bdf8';   // 다이아
  if (count >= 30) return '#facc15';   // 골드
  if (count >= 20) return '#e5e7eb';   // 실버
  if (count >= 10) return '#b45309';   // 브론즈
  return '#111827';                    // 기본(블랙)
}

function MyPage() {
  // URL 파라미터 (다른 유저 페이지면 값이 있음)
  const { userId: paramUserId } = useParams();

  // 로그인 유저 ID
  const [loginUserId, setLoginUserId] = useState(null);

  // 현재 페이지의 주인 유저 정보
  const [user, setUser] = useState();
  // 유저 게시물 목록
  const [feeds, setFeeds] = useState([]);
  // 사진 / 텍스트 보기 구분
  const [viewType, setViewType] = useState('image'); // 기본값: 사진

  // 내 페이지인지, 남의 페이지인지
  const [isMyPage, setIsMyPage] = useState(false);

  // 내가 이 유저를 팔로우 중인지
  const [isFollowing, setIsFollowing] = useState(false);

  // 팔로워 / 팔로잉 모달 상태 + 리스트
  const [openFollowers, setOpenFollowers] = useState(false);
  const [openFollowing, setOpenFollowing] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);

  // 프로필 수정 모달 상태
  const [openProfileEdit, setOpenProfileEdit] = useState(false);
  const [editUserName, setEditUserName] = useState('');
  const [profileFile, setProfileFile] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);

  const navigate = useNavigate();

  // 유저 정보와 게시물 조회
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

    // URL 이 /user/:userId 이면 그 아이디, 아니면 내 아이디
    const targetUserId = paramUserId || loginId;
    setIsMyPage(targetUserId === loginId);

    fetch("http://localhost:3010/user/" + targetUserId, {
      headers: {
        Authorization: "Bearer " + token
      }
    })
      .then(res => res.json())
      .then(data => {
        setUser(data.user);
        setFeeds(data.feeds || []);
        setIsFollowing(data.isFollowing || false);
      })
      .catch(err => {
        console.log(err);
      });
  }

  useEffect(() => {
    fnGetUser();
  }, [paramUserId]);

  // 활동 횟수 (등급 계산용)
  const activityCount = user?.feedCnt ?? feeds.length;
  const gradeBorderColor = getGradeBorderColor(activityCount);
  const canChangeProfileImage = activityCount >= 10; // 브론즈 이상이면 true

  // 보기 타입에 따라 피드 필터링
  const filteredFeeds = feeds.filter((feed) => {
    if (viewType === 'image') {
      // 이미지가 있는 게시글만
      return !!feed.imgPath;
    } else {
      // 이미지가 없는 텍스트 게시글만
      return !feed.imgPath;
    }
  });

  // 팔로우 토글
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
          headers: {
            Authorization: "Bearer " + token
          }
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

  // 팔로워 목록 조회
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

  // 팔로잉 목록 조회
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

  // 프로필 수정 모달 열기
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

  // 프로필 수정 모달 닫기
  const handleCloseProfileEdit = () => {
    setOpenProfileEdit(false);
    setProfileFile(null);
    setProfilePreview(null);
  };

  // 프로필 이미지 선택
  const handleProfileFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileFile(file);
    setProfilePreview(URL.createObjectURL(file));
  };

  // 프로필 수정 저장
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

      // 브론즈 이상 + 파일 선택 했으면 프로필 이미지도 전송
      if (canChangeProfileImage && profileFile) {
        formData.append("profileImg", profileFile);
      }

      const res = await fetch("http://localhost:3010/user/profile", {
        method: "PUT",
        headers: {
          Authorization: "Bearer " + token
        },
        body: formData
      });

      const data = await res.json();
      console.log("profile update ==> ", data);

      if (data.result === "success") {
        alert("프로필이 수정되었습니다.");

        // 화면의 user 상태 갱신
        setUser(prev => prev ? {
          ...prev,
          userName: data.user?.userName || editUserName.trim(),
          profileImgPath: data.user?.profileImgPath ?? prev.profileImgPath
        } : prev);

        handleCloseProfileEdit();
      } else {
        alert(data.message || "프로필 수정 중 오류가 발생했습니다.");
      }
    } catch (e) {
      console.log(e);
      alert("프로필 수정 중 오류가 발생했습니다.");
    }
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
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
        >
          {/* 상단 프로필 헤더 영역 */}
          <Box
            sx={{
              width: "100%",
              maxWidth: 1100,
              borderBottom: "1px solid #e5e7eb",
              pb: 3,
              mb: 4
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                columnGap: 4
              }}
            >
              {/* 프로필 이미지 */}
              <Avatar
                alt="프로필 이미지"
                src={
                  user?.profileImgPath
                    ? "http://localhost:3010" + user.profileImgPath
                    : "http://localhost:3010/uploads/userDefault.png"
                }
                sx={{
                  width: 80,
                  height: 80,
                  border: `2px solid ${gradeBorderColor}`,
                  boxSizing: "border-box",
                  flexShrink: 0
                }}
              />

              {/* 이름, 아이디, 소개 + (남의 페이지일 때) 팔로우 버튼 / (내 페이지일 때) 프로필 수정 버튼 */}
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

                  {/* 남의 마이페이지일 때만 팔로우 버튼 노출 */}
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

                  {/* 내 마이페이지일 때만 프로필 수정 버튼 노출 */}
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
                    sx={{ mt: 0.5, display: 'block', color: '#6b7280' }}
                  >
                    활동 글 {activityCount}개 · {activityCount >= 10 ? '브론즈 이상 등급입니다.' : '10개 이상 작성 시 프로필 사진을 직접 등록할 수 있어요.'}
                  </Typography>
                )}
              </Box>

              {/* 팔로워 / 팔로잉 / 게시물 요약 */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  columnGap: 4,
                  ml: 2
                }}
              >
                <Box
                  sx={{ textAlign: "center", cursor: "pointer" }}
                  onClick={fetchFollowers}
                >
                  <Typography variant="subtitle2" color="text.secondary">
                    팔로워
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {user?.follower ?? 0}
                  </Typography>
                </Box>
                <Box
                  sx={{ textAlign: "center", cursor: "pointer" }}
                  onClick={fetchFollowing}
                >
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

          {/* 사진 / 텍스트 토글 버튼 */}
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
            {/* 사진 보기 버튼 */}
            <Button
              onClick={() => setViewType('image')}
              startIcon={<ImageIcon sx={{ fontSize: 18 }} />}
              sx={{
                textTransform: "none",
                borderRadius: "999px",
                fontSize: "0.85rem",
                px: 1.8,
                py: 0.6,
                backgroundColor: viewType === 'image' ? "#111827" : "transparent",
                color: viewType === 'image' ? "#ffffff" : "#6b7280",
                border: "1px solid",
                borderColor: viewType === 'image' ? "#111827" : "#d1d5db",
                "&:hover": {
                  backgroundColor: viewType === 'image' ? "#111827" : "#f3f4f6"
                }
              }}
            >
              사진
            </Button>

            {/* 텍스트 보기 버튼 */}
            <Button
              onClick={() => setViewType('text')}
              startIcon={<ArticleIcon sx={{ fontSize: 18 }} />}
              sx={{
                textTransform: "none",
                borderRadius: "999px",
                fontSize: "0.85rem",
                px: 1.8,
                py: 0.6,
                backgroundColor: viewType === 'text' ? "#111827" : "transparent",
                color: viewType === 'text' ? "#ffffff" : "#6b7280",
                border: "1px solid",
                borderColor: viewType === 'text' ? "#111827" : "#d1d5db",
                "&:hover": {
                  backgroundColor: viewType === 'text' ? "#111827" : "#f3f4f6"
                }
              }}
            >
              텍스트
            </Button>
          </Box>

          {/* 아래쪽 게시물 그리드 */}
          <Box sx={{ width: "100%", maxWidth: 1100 }}>
            <Grid container spacing={2}>
              {filteredFeeds.map((feed) => (
                <Grid item xs={12} sm={6} md={4} key={feed.feedId}>
                  <Card sx={{ borderRadius: "18px" }}>
                    {/* 이미지가 있는 경우에만 출력 */}
                    {feed.imgPath && (
                      <CardMedia
                        component="img"
                        height="220"
                        image={"http://localhost:3010" + feed.imgPath}
                        alt={feed.title}
                      />
                    )}

                    <CardContent sx={{ p: 2 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{ mb: 0.5 }}
                        noWrap
                      >
                        {feed.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        noWrap
                      >
                        {feed.content}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mt: 1 }}
                      >
                        {feed.cdatetime}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}

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

      {/* 팔로워 리스트 모달 */}
      <Dialog
        open={openFollowers}
        onClose={() => setOpenFollowers(false)}
        fullWidth
        maxWidth="xs"
      >
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
                <ListItemText
                  primary={u.userName}
                  secondary={"@" + u.userId}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFollowers(false)}>닫기</Button>
        </DialogActions>
      </Dialog>

      {/* 팔로잉 리스트 모달 */}
      <Dialog
        open={openFollowing}
        onClose={() => setOpenFollowing(false)}
        fullWidth
        maxWidth="xs"
      >
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
                <ListItemText
                  primary={u.userName}
                  secondary={"@" + u.userId}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFollowing(false)}>닫기</Button>
        </DialogActions>
      </Dialog>

      {/* ✅ 프로필 수정 모달 */}
      <Dialog
        open={openProfileEdit}
        onClose={handleCloseProfileEdit}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>프로필 수정</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* 닉네임 */}
            <TextField
              label="닉네임"
              fullWidth
              value={editUserName}
              onChange={(e) => setEditUserName(e.target.value)}
            />

            {/* 프로필 이미지 업로드 영역 */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                프로필 이미지
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  src={
                    profilePreview ||
                    (user?.profileImgPath
                      ? "http://localhost:3010" + user.profileImgPath
                      : "http://localhost:3010/uploads/userDefault.png")
                  }
                  sx={{ width: 60, height: 60 }}
                />

                <Box>
                  <Button
                    component="label"
                    variant="outlined"
                    size="small"
                    disabled={!canChangeProfileImage}
                    sx={{ textTransform: 'none', borderRadius: '999px' }}
                  >
                    이미지 선택
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleProfileFileChange}
                    />
                  </Button>
                  <Typography
                    variant="caption"
                    sx={{ display: 'block', mt: 0.5, color: '#6b7280' }}
                  >
                    {canChangeProfileImage
                      ? '프로필 사진을 변경할 수 있습니다.'
                      : '작성 글 10개 이상(브론즈 등급)부터 프로필 사진을 등록할 수 있어요.'}
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
