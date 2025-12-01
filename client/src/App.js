// src/App.js
import React from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import Login from './components/Login';
import Join from './components/Join';
import Feed from './components/Feed';
import Register from './components/Register';
import MyPage from './components/MyPage';
import Menu from './components/Menu';
import Setting from './components/setting';
import Mui from './components/Mui';

function App() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/' || location.pathname === '/join';

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      {!isAuthPage && <Menu />}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/join" element={<Join />} />

          {/* 홈(전체 피드) */}
          <Route path="/feedAll" element={<Feed />} />
          {/* 파도타기(랜덤 or 알고리즘 피드) */}
          <Route path="/feed" element={<Feed />} />

          <Route path="/register" element={<Register />} />

          {/* ✅ 내 마이페이지 */}
          <Route path="/mypage" element={<MyPage />} />
          {/* ✅ 다른 유저 마이페이지 (피드에서 프로필 클릭) */}
          <Route path="/user/:userId" element={<MyPage />} />

          <Route path="/mui" element={<Mui />} />
          <Route path="/setting" element={<Setting />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default App;
