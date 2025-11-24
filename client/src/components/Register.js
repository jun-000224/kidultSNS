<<<<<<< HEAD
import React, { useRef, useState } from 'react';
import { jwtDecode } from "jwt-decode";
=======
import React, { useRef } from 'react';
>>>>>>> b1e27c0d9d7bab1705a5d12686ff62f70746639a
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
<<<<<<< HEAD
import { useNavigate } from 'react-router-dom';   // ✅ 추가

function Register() {
  const [files, setFiles] = useState([]);
  const contentRef = useRef();
  const navigate = useNavigate();                // ✅ 추가
=======
import { jwtDecode } from "jwt-decode";

function Register() {
  const [files, setFile] = React.useState([]);
  let contentRef = useRef();
>>>>>>> b1e27c0d9d7bab1705a5d12686ff62f70746639a

  // 파일 선택
  const handleFileChange = (event) => {
<<<<<<< HEAD
    const selectedFiles = Array.from(event.target.files); // FileList → 배열 변환
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

      if (data.msg === "success") {
        await fnUploadFile(data.feedId); // 2) 이미지 업로드
        alert("등록 완료!");
        navigate("/feed");               // ✅ 여기서 페이지 이동
      } else {
        alert("등록 실패");
      }
    } catch (err) {
      console.error(err);
      alert("서버 통신 중 오류 발생");
    }
=======
    setFile(event.target.files);
  };

  function fnFeedAdd(){
    if(files.length == 0){
      alert("이미지를 선택해주세요!");
      return;
    }
    const token = localStorage.getItem("token");
    const decoded = jwtDecode(token);
    let param = {
      content : contentRef.current.value,
      userId : decoded.userId
    }
    fetch("http://localhost:3010/feed", {
      method : "POST",
      headers : {
        "Content-type" : "application/json"
      },
      body : JSON.stringify(param)
    })
    .then(res => res.json())
    .then(data => {
      console.log(data);
      fnUploadFile(data.result[0].insertId);
    })

  }


  const fnUploadFile = (feedId)=>{
  const formData = new FormData();
    for(let i=0; i<files.length; i++){
      formData.append("file", files[i]); 
    } 
    formData.append("feedId", feedId);
    fetch("http://localhost:3010/feed/upload", {
      method: "POST",
      body: formData
    })
    .then(res => res.json())
    .then(data => {
      console.log(data);
      // navigate("/feed"); // 원하는 경로
    })
    .catch(err => {
      console.error(err);
    });
>>>>>>> b1e27c0d9d7bab1705a5d12686ff62f70746639a
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
        <Box display="flex" alignItems="center" margin="normal" fullWidth>
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
<<<<<<< HEAD

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
=======
          {files.length > 0 && (
            [...files].map(item => {
              return <Avatar
                alt="첨부된 이미지"
                src={URL.createObjectURL(item)}
                sx={{ width: 56, height: 56, marginLeft: 2 }}
              />
            })
            
>>>>>>> b1e27c0d9d7bab1705a5d12686ff62f70746639a
          )}

          <Typography variant="body1" sx={{ marginLeft: 2 }}>
<<<<<<< HEAD
            {files.length > 0 ? `${files.length}개 선택됨` : "첨부할 파일 선택"}
          </Typography>
        </Box>

        <Button
          onClick={fnFeedAdd}
          variant="contained"
          color="primary"
          fullWidth
          style={{ marginTop: "20px" }}
        >
=======
            {files.length > 0 ? files[0].name : '첨부할 파일 선택'}
          </Typography>
        </Box>

        <Button onClick={fnFeedAdd} variant="contained" color="primary" fullWidth style={{ marginTop: '20px' }}>
>>>>>>> b1e27c0d9d7bab1705a5d12686ff62f70746639a
          등록하기
        </Button>
      </Box>
    </Container>
  );
}

export default Register;
