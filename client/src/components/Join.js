// src/components/Join.js
import React, { useRef } from 'react';
import { TextField, Button, Container, Typography, Box } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';

function Join() {
  let navigate = useNavigate();
  let userId = useRef();
  let pwd = useRef();
  let userName = useRef();
  let addr = useRef();
  let phone = useRef();

  return (
    <Container maxWidth="xs">
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
      >
        <Typography variant="h4" gutterBottom>
          회원가입
        </Typography>

        <TextField inputRef={userId} label="아이디" variant="outlined" margin="normal" fullWidth />

        <TextField
          label="비밀번호"
          variant="outlined"
          margin="normal"
          fullWidth
          type="password"
          inputRef={pwd}
        />

        <TextField inputRef={userName} label="닉네임" variant="outlined" margin="normal" fullWidth />

        <TextField inputRef={addr} label="주소" variant="outlined" margin="normal" fullWidth />

        <TextField inputRef={phone} label="핸드폰 번호" variant="outlined" margin="normal" fullWidth />

        <Button
          variant="contained"
          color="primary"
          fullWidth
          style={{ marginTop: '20px' }}
          onClick={() => {
            let param = {
              userId: userId.current.value,
              pwd: pwd.current.value,
              userName: userName.current.value,
              addr: addr.current.value,
              phone: phone.current.value
            };

            fetch("http://localhost:3010/user/join", {
              method: "POST",
              headers: { "Content-type": "application/json" },
              body: JSON.stringify(param)
            })
              .then(res => res.json())
              .then(data => {
                alert(data.msg);
                if (data.result === "success") {
                  navigate("/");
                }
              });
          }}
        >
          회원가입
        </Button>

        <Typography variant="body2" style={{ marginTop: '10px' }}>
          이미 회원이라면? <Link to="/">로그인</Link>
        </Typography>
      </Box>
    </Container>
  );
}

export default Join;
