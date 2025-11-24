import React, { useRef } from 'react';
import { TextField, Button, Container, Typography, Box } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';

function Login() {
  let navigate = useNavigate();
  let idRef = useRef(null);
  let pwdRef = useRef();
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
          로그인
        </Typography>
        <TextField inputRef={idRef} label="ID" variant="outlined" margin="normal" fullWidth />
        <TextField
          label="Password"
          variant="outlined"
          margin="normal"
          fullWidth
          type="password"
          inputRef={pwdRef}
        />
        <Button onClick={()=>{
          let param = {
            userId : idRef.current.value,
            pwd : pwdRef.current.value
          };

          fetch("http://localhost:3010/user/login", {
                method : "POST",
                headers : {
                  "Content-type" : "application/json"
                },
                body : JSON.stringify(param)
              })
                .then(res => res.json())
                .then(data => {
                  console.log(data);
                  alert(data.msg);
                  if(data.result){
                    localStorage.setItem("token", data.token);
                    navigate("/feed");     
                    // window.location.href="/feed";
                  }
                })

        }} variant="contained" color="primary" fullWidth style={{ marginTop: '20px' }}>
          로그인
        </Button>
        <Typography variant="body2" style={{ marginTop: '10px' }}>
          회원아니셈 ? <Link to="/join">회원가입</Link>
        </Typography>
      </Box>
    </Container>
  );
}

export default Login;