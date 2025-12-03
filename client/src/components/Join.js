// src/components/Join.js
import React, { useRef, useState } from 'react';
import { TextField, Button, Container, Typography, Box, Grid } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';

function Join() {
  let navigate = useNavigate();

  // 기존 입력값
  let userId = useRef();
  let pwd = useRef();
  let userName = useRef();
  let addr = useRef();

  // 전화번호 3칸 상태
  const [phone1, setPhone1] = useState('');
  const [phone2, setPhone2] = useState('');
  const [phone3, setPhone3] = useState('');

  // 전화번호 input 포커스 이동용 ref
  const phoneRef1 = useRef();
  const phoneRef2 = useRef();
  const phoneRef3 = useRef();

  // 중복확인 상태
  const [idChecked, setIdChecked] = useState(false);
  const [phoneChecked, setPhoneChecked] = useState(false);

  // 아이디 중복 체크
  async function checkIdExists(id) {
    const res = await fetch(`http://localhost:3010/user/check-id?userId=${id}`);
    const data = await res.json();
    return data.exists;
  }

  // 전화번호 중복 체크
  async function checkPhoneExists(num) {
    const res = await fetch(`http://localhost:3010/user/check-phone?phone=${num}`);
    const data = await res.json();
    return data.exists;
  }

  // 전화번호 입력 공통 처리 (숫자만, 길이 제한, 자동 포커스)
  const handlePhoneChange = (value, maxLen, setter, nextRef) => {
    // 숫자만 허용
    const onlyNums = value.replace(/\D/g, '');
    const trimmed = onlyNums.slice(0, maxLen);

    setter(trimmed);
    // 입력 변경되면 중복확인 다시 해야 하므로 초기화
    setPhoneChecked(false);

    // 최대 길이에 도달하면 다음 칸으로 포커스 이동
    if (trimmed.length === maxLen && nextRef && nextRef.current) {
      nextRef.current.focus();
    }
  };

  // 최종 전화번호(하이픈 없는 11자리)
  const fullPhone = phone1 + phone2 + phone3;

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

        {/* 아이디 + 중복체크 버튼 */}
        <Grid container spacing={1} alignItems="center">
          <Grid item xs={8}>
            <TextField
              inputRef={userId}
              label="아이디"
              variant="outlined"
              margin="normal"
              fullWidth
              onChange={() => setIdChecked(false)} // 다시 입력하면 초기화
            />
          </Grid>
          <Grid item xs={4}>
            <Button
              variant="outlined"
              fullWidth
              sx={{ marginTop: '8px' }}
              onClick={async () => {
                const idValue = userId.current.value.trim();
                if (!idValue) {
                  alert("아이디를 입력해주세요.");
                  return;
                }

                const exists = await checkIdExists(idValue);
                if (exists) {
                  alert("이미 사용 중인 아이디입니다.");
                  setIdChecked(false);
                } else {
                  alert("사용 가능한 아이디입니다.");
                  setIdChecked(true);
                }
              }}
            >
              중복확인
            </Button>
          </Grid>
        </Grid>

        {/* 비밀번호 */}
        <TextField
          label="비밀번호"
          variant="outlined"
          margin="normal"
          fullWidth
          type="password"
          inputRef={pwd}
        />

        {/* 닉네임 */}
        <TextField
          inputRef={userName}
          label="닉네임"
          variant="outlined"
          margin="normal"
          fullWidth
        />

        {/* 주소 */}
        <TextField
          inputRef={addr}
          label="주소"
          variant="outlined"
          margin="normal"
          fullWidth
        />

        {/* 전화번호 3칸 + 중복확인 버튼 */}
        <Grid container spacing={1} alignItems="center" sx={{ mt: 1 }}>
          <Grid item xs={8}>
            <Grid container spacing={1} alignItems="center">
              <Grid item xs={4}>
                <TextField
                  label="휴대폰"
                  placeholder="010"
                  variant="outlined"
                  margin="normal"
                  fullWidth
                  inputRef={phoneRef1}
                  value={phone1}
                  onChange={(e) =>
                    handlePhoneChange(e.target.value, 3, setPhone1, phoneRef2)
                  }
                  inputProps={{ maxLength: 3 }}
                />
              </Grid>
              <Grid item xs={1} sx={{ textAlign: 'center' }}>
                -
              </Grid>
              <Grid item xs={3}>
                <TextField
                  variant="outlined"
                  margin="normal"
                  fullWidth
                  inputRef={phoneRef2}
                  value={phone2}
                  onChange={(e) =>
                    handlePhoneChange(e.target.value, 4, setPhone2, phoneRef3)
                  }
                  inputProps={{ maxLength: 4 }}
                />
              </Grid>
              <Grid item xs={1} sx={{ textAlign: 'center' }}>
                -
              </Grid>
              <Grid item xs={3}>
                <TextField
                  variant="outlined"
                  margin="normal"
                  fullWidth
                  inputRef={phoneRef3}
                  value={phone3}
                  onChange={(e) =>
                    handlePhoneChange(e.target.value, 4, setPhone3, null)
                  }
                  inputProps={{ maxLength: 4 }}
                />
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={4}>
            <Button
              variant="outlined"
              fullWidth
              sx={{ marginTop: '8px' }}
              onClick={async () => {
                // 빈칸 체크
                if (!phone1 || !phone2 || !phone3) {
                  alert("휴대폰 번호를 모두 입력해주세요.");
                  return;
                }

                // 전체 11자리 숫자인지 검사
                if (!/^\d{11}$/.test(fullPhone)) {
                  alert("숫자만 사용하여 휴대폰 번호 11자리를 입력해주세요.");
                  return;
                }

                const exists = await checkPhoneExists(fullPhone);
                if (exists) {
                  alert("이미 등록된 전화번호입니다.");
                  setPhoneChecked(false);
                } else {
                  alert("사용 가능한 전화번호입니다.");
                  setPhoneChecked(true);
                }
              }}
            >
              중복확인
            </Button>
          </Grid>
        </Grid>

        {/* 회원가입 버튼 */}
        <Button
          variant="contained"
          color="primary"
          fullWidth
          style={{ marginTop: '20px' }}
          onClick={async () => {
            const idValue = userId.current.value.trim();

            // 중복확인 안 하면 가입 불가
            if (!idChecked) {
              alert("아이디 중복확인을 해주세요.");
              return;
            }

            if (!phoneChecked) {
              alert("전화번호 중복확인을 해주세요.");
              return;
            }

            // 전화번호 형식 한 번 더 체크(안전용)
            if (!/^\d{11}$/.test(fullPhone)) {
              alert("휴대폰 번호 형식이 올바르지 않습니다.");
              return;
            }

            let param = {
              userId: idValue,
              pwd: pwd.current.value,
              userName: userName.current.value,
              addr: addr.current.value,
              phone: fullPhone   // 하이픈 없이 저장
            };

            fetch("http://localhost:3010/user/join", {
              method: "POST",
              headers: {
                "Content-type": "application/json"
              },
              body: JSON.stringify(param)
            })
              .then((res) => res.json())
              .then((data) => {
                alert(data.msg);
                if (data.result === "success") navigate("/");
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
