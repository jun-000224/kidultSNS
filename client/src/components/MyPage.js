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
  Button,          // 버튼 추가
} from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';     // 아이콘 추가
import ArticleIcon from '@mui/icons-material/Article'; // 아이콘 추가
import { jwtDecode } from "jwt-decode";
import { useNavigate } from 'react-router-dom';

function MyPage() {
  // 유저 정보
  let [user, setUser] = useState();
  // 유저 게시물 목록
  let [feeds, setFeeds] = useState([]);
  // 사진 / 텍스트 보기 구분
  let [viewType, setViewType] = useState('image'); // 기본값: 사진

  let navigate = useNavigate();

  // 유저 정보와 게시물 조회
  function fnGetUser() {
    const token = localStorage.getItem("token");

    if (token) {
      const decoded = jwtDecode(token);

      fetch("http://localhost:3010/user/" + decoded.userId)
        .then(res => res.json())
        .then(data => {
          setUser(data.user);
          setFeeds(data.feeds || []);
        })
        .catch(err => {
          console.log(err);
        });
    } else {
      alert("로그인 후 이용해주세요.");
      navigate("/");
    }
  }

  useEffect(() => {
    fnGetUser();
  }, []);

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
          {/* 상단 프로필 헤더 영역 (기준 코드 그대로) */}
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
                  border: "2px solid #000000ff",
                  boxSizing: "border-box",
                  flexShrink: 0
                }}
              />

              {/* 이름, 아이디, 소개 */}
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", columnGap: 2, mb: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    {user?.userName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    @{user?.userId}
                  </Typography>
                </Box>

                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                  내 소개
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user?.intro || "간단한 소개글을 작성해보세요."}
                </Typography>
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
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    팔로워
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {user?.follower ?? 0}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "center" }}>
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

          {/* 여기부터 추가: 사진 / 텍스트 토글 버튼 */}
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
    </Box>
  );
}

export default MyPage;
