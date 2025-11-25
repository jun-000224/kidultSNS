import React, { useRef, useState } from 'react';
import { jwtDecode } from "jwt-decode";
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  InputLabel,
  FormControl,
  Select,
  MenuItem,
  Avatar,
  IconButton,
} from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

function Register() {
  const [files, setFiles] = useState([]);
  const contentRef = useRef(null);
  const navigate = useNavigate();

  // 파일 선택
  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []); // FileList → 배열 변환
    setFiles(selectedFiles);
  };

  // 이미지 업로드
  async function fnUploadFile(feedId) {
    if (!files || files.length === 0) return;

    const formData = new FormData();
    formData.append("feedId", feedId);

    files.forEach((file) => {
      formData.append("file", file);
    });

    const res = await fetch("http://localhost:3010/feed/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    console.log("upload result ===> ", data);
  }

  // 피드 등록
  async function fnFeedAdd() {
    if (!files || files.length === 0) {
      alert("이미지를 선택해주세요!");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("로그인 후 이용해주세요.");
      return;
    }

    const decoded = jwtDecode(token);

    const param = {
      content: contentRef.current.value,
      userId: decoded.userId,
    };

    try {
      // 1) 텍스트 먼저 저장
      const res = await fetch("http://localhost:3010/feed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(param),
      });

      const data = await res.json();
      console.log("feed insert result ===> ", data);

      // 서버에서 { msg: "success", feedId: ... } 형태로 내려온다고 가정
      if (data.msg === "success") {
        await fnUploadFile(data.feedId); // 2) 이미지 업로드
        alert("등록 완료!");
        navigate("/feed");
      } else {
        alert("등록 실패");
      }
    } catch (err) {
      console.error(err);
      alert("서버 통신 중 오류 발생");
    }
  }

  return (
    <Container maxWidth="sm">
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="flex-start"
        minHeight="100vh"
        sx={{ padding: '20px' }}
      >
        <Typography variant="h4" gutterBottom>
          등록
        </Typography>

        {/* 카테고리 (DB 연결 안되어 있으므로 UI만 유지) */}
        <FormControl fullWidth margin="normal">
          <InputLabel>카테고리</InputLabel>
          <Select defaultValue="" label="카테고리">
            <MenuItem value={1}>일상</MenuItem>
            <MenuItem value={2}>여행</MenuItem>
            <MenuItem value={3}>음식</MenuItem>
          </Select>
        </FormControl>

        <TextField label="제목" variant="outlined" margin="normal" fullWidth />

        <TextField
          inputRef={contentRef}
          label="내용"
          variant="outlined"
          margin="normal"
          fullWidth
          multiline
          rows={4}
        />

        {/* 파일 선택 + 미리보기 */}
        <Box
          display="flex"
          alignItems="center"
          sx={{ mt: 2, width: '100%' }}
        >
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="file-upload"
            type="file"
            onChange={handleFileChange}
            multiple
          />
          <label htmlFor="file-upload">
            <IconButton color="primary" component="span">
              <PhotoCamera />
            </IconButton>
          </label>

          {/* 여러 장 썸네일 */}
          {files.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1, marginLeft: 2 }}>
              {files.map((file, index) => (
                <Avatar
                  key={index}
                  alt={file.name}
                  src={URL.createObjectURL(file)}
                  sx={{ width: 56, height: 56 }}
                />
              ))}
            </Box>
          )}

          <Typography variant="body1" sx={{ marginLeft: 2 }}>
            {files.length > 0 ? `${files.length}개 선택됨` : "첨부할 파일 선택"}
          </Typography>
        </Box>

        <Button
          onClick={fnFeedAdd}
          variant="contained"
          color="primary"
          fullWidth
          sx={{ marginTop: '20px' }}
        >
          등록하기
        </Button>
      </Box>
    </Container>
  );
}

export default Register;
