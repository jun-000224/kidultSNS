// src/components/Login.js
import React, { useRef } from 'react';
import { TextField, Button, Box, Paper } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';

function Login() {
  let navigate = useNavigate();
  let idRef = useRef(null);
  let pwdRef = useRef();

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',    // 가로 정중앙
        alignItems: 'center',        // 세로 정중앙
        minHeight: '100vh',
        background: '#fafafa'
      }}
    >
      {/* 로그인 카드만 중앙 배치 */}
      <Paper
        elevation={6}
        sx={{
          width: '380px',
          padding: '40px',
          borderRadius: '12px',
          backgroundColor: 'white',
          border: '1px solid #dbdbdb'
        }}
      >
        {/* 로고 이미지 */}
        <Box sx={{ textAlign: 'center', marginBottom: '20px' }}>
          <img
            src="http://localhost:3010/uploads/HW_LOGO.png"
            alt="Hobby Wave Logo"
            style={{ width: '70px', height: '70px' }}
          />
        </Box>

        {/* 아이디 */}
        <TextField
          inputRef={idRef}
          label="아이디"
          variant="outlined"
          margin="dense"
          fullWidth
        />

        {/* 비밀번호 */}
        <TextField
          label="비밀번호"
          variant="outlined"
          margin="dense"
          fullWidth
          type="password"
          inputRef={pwdRef}
        />

        {/* 로그인 버튼 */}
        <Button
          onClick={() => {
            let param = {
              userId: idRef.current.value,
              pwd: pwdRef.current.value
            };

            fetch("http://localhost:3010/user/login", {
              method: "POST",
              headers: {
                "Content-type": "application/json"
              },
              body: JSON.stringify(param)
            })
              .then(res => res.json())
              .then(data => {
                console.log(data);

                if (data.result === "success") {
                  const userName = data.user?.userName || "";
                  alert(`${userName} ${data.msg}`);   // 예: "바나나맛커피 님 환영합니다."

                  localStorage.setItem("token", data.token);
                  navigate("/feedAll");
                } else {
                  // 실패일 때는 user 없음 → msg만
                  alert(data.msg || "로그인에 실패했습니다.");
                }
              })
              .catch(err => {
                console.error(err);
                alert("로그인 중 오류가 발생했습니다.");
              });
          }}
          variant="contained"
          fullWidth
          sx={{
            marginTop: '16px',
            padding: '10px 0',
            backgroundColor: '#3897f0',
            fontWeight: 600,
            borderRadius: '8px',
            textTransform: 'none',
            fontSize: '1rem'
          }}
        >
          로그인
        </Button>


        {/* 안내 문구 */}
        <Box
          sx={{
            textAlign: 'center',
            marginTop: '20px',
            fontSize: '0.9rem',
            color: '#737373'
          }}
        >
          처음이신가요?
        </Box>

        {/* 회원가입 링크 */}
        <Box
          sx={{
            textAlign: 'center',
            marginTop: '20px',
            fontSize: '0.9rem'
          }}
        >
          그렇다면,{" "}
          <Link to="/join" style={{ color: '#0095f6', textDecoration: 'none' }}>
            가입하기!
          </Link>
        </Box>
      </Paper>
    </Box>
  );
}

export default Login;
