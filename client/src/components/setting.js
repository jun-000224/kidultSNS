// src/components/Setting.js
import React from "react";
import {
  Box,
  Paper,
  Typography,
  Divider,
  Button,
  Stack,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

function Setting() {
  const navigate = useNavigate();

  // 로그아웃
  const handleLogout = () => {
    fetch("http://localhost:3010/user/logout", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({}),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        alert(data.msg || "로그아웃 되었습니다.");
        if (data.result) {
          localStorage.removeItem("token");
          navigate("/");
        }
      })
      .catch((err) => {
        console.log(err);
        alert("로그아웃 중 오류가 발생했습니다.");
      });
  };

  // 도움말
  const handleHelp = () => {
    alert("도움말 기능은 준비중입니다.");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#f3f4f6",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        px: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: "100%",
          maxWidth: 420,
          borderRadius: 3,
          p: 3,
          backgroundColor: "#ffffff",
          boxShadow:
            "0 10px 30px rgba(15,23,42,0.12), 0 1px 3px rgba(15,23,42,0.08)",
        }}
      >
        {/* 헤더 */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            설정
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "#6b7280", mt: 0.5 }}
          >
            Hobby Wave 계정과 앱 정보를 확인할 수 있어요.
          </Typography>
        </Box>

        <Divider sx={{ borderColor: "#e5e7eb" }} />

        <Stack spacing={3} sx={{ mt: 3 }}>
          {/* 도움말 섹션 */}
          <Box sx={{ px: 1 }}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, mb: 0.5 }}
            >
              도움말
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "#6b7280", mb: 1.5 }}
            >
              서비스 안내와 사용법
            </Typography>

            <Button
              variant="outlined"
              fullWidth
              onClick={handleHelp}
              sx={{
                py: 1,
                borderRadius: "999px",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.9rem",
              }}
            >
              도움말 보기
            </Button>
          </Box>

          <Divider sx={{ borderColor: "#e5e7eb" }} />

          {/* 로그아웃 섹션 */}
          <Box sx={{ px: 1 }}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, mb: 0.5 }}
            >
              계정
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "#6b7280", mb: 2 }}
            >
              현재 로그인된 계정에서 로그아웃합니다.
            </Typography>

            <Button
              onClick={handleLogout}
              variant="contained"
              fullWidth
              sx={{
                py: 1.2,
                backgroundColor: "#ef4444",
                "&:hover": { backgroundColor: "#dc2626" },
                fontWeight: 600,
                borderRadius: "999px",
                textTransform: "none",
                fontSize: "0.95rem",
              }}
            >
              로그아웃
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}

export default Setting;
