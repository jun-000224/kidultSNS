// src/components/Menu.js
import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box
} from '@mui/material';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import SurfingIcon from '@mui/icons-material/Surfing';
import SearchIcon from '@mui/icons-material/Search';
import ReplayIcon from '@mui/icons-material/Replay';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { Link } from 'react-router-dom';

function Menu() {
  // 사이드 메뉴 전체 너비
  const drawerWidth = 130;

  // 현재 선택된 메뉴 상태  기본은 홈
  const [activeMenu, setActiveMenu] = useState('home');

  // 공통 메뉴 스타일  메뉴 키에 따라 활성화 스타일 추가
  const getItemSx = (key) => ({
    py: 0.5,
    px: 1.4,
    justifyContent: 'flex-start',
    borderRadius: '12px',
    mx: 1,
    '&:hover': {
      backgroundColor: '#f3f4f6'
    },
    // 기본은 텍스트 숨기기
    '& .menu-label': {
      opacity: 0,
      maxWidth: 0,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      transition: 'all 0.2s ease'
    },
    // 호버 시 텍스트 펼치기
    '&:hover .menu-label': {
      opacity: 1,
      maxWidth: 140,
      ml: 1.4
    },
    // 선택된 메뉴는 항상 호버 상태처럼 유지
    ...(activeMenu === key && {
      backgroundColor: '#f3f4f6',
      '& .menu-label': {
        opacity: 1,
        maxWidth: 140,
        ml: 1.4
      }
    })
  });

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          overflow: 'hidden',
          width: drawerWidth,
          boxSizing: 'border-box',
          borderRight: 'none',
          backgroundColor: '#ffffff'
        }
      }}
    >
      {/* 로고 영역 */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          paddingY: 1.5
        }}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: '14px',
            overflow: 'hidden',
            border: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f3f4f6'
          }}
        >
          <img
            src="http://localhost:3010/uploads/HW_LOGO.png"
            alt="Hobby Wave Logo"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </Box>
      </Box>

      {/* 메뉴 리스트 */}
      <List
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0.3,
          overflow: 'hidden',
          pt: 0.5
        }}
      >
        {/* 홈 */}
        <ListItemButton
          component={Link}
          to="/feed"
          sx={getItemSx('home')}
          onClick={() => setActiveMenu('home')}
        >
          <ListItemIcon sx={{ minWidth: 0, justifyContent: 'center' }}>
            <HomeOutlinedIcon sx={{ fontSize: 22 }} />
          </ListItemIcon>
          <ListItemText
            primary="홈"
            className="menu-label"
            primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }}
          />
        </ListItemButton>

        {/* 파도타기 */}
        <ListItemButton
          component={Link}
          to="/register"
          sx={getItemSx('surf')}
          onClick={() => setActiveMenu('surf')}
        >
          <ListItemIcon sx={{ minWidth: 0, justifyContent: 'center' }}>
            <SurfingIcon sx={{ fontSize: 22 }} />
          </ListItemIcon>
          <ListItemText
            primary="파도타기"
            className="menu-label"
            primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }}
          />
        </ListItemButton>

        {/* 검색 */}
        <ListItemButton
          component={Link}
          to="#"
          sx={getItemSx('search')}
          onClick={() => setActiveMenu('search')}
        >
          <ListItemIcon sx={{ minWidth: 0, justifyContent: 'center' }}>
            <SearchIcon sx={{ fontSize: 22 }} />
          </ListItemIcon>
          <ListItemText
            primary="검색"
            className="menu-label"
            primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }}
          />
        </ListItemButton>

        {/* 다시보기 */}
        <ListItemButton
          component={Link}
          to="#"
          sx={getItemSx('replay')}
          onClick={() => setActiveMenu('replay')}
        >
          <ListItemIcon sx={{ minWidth: 0, justifyContent: 'center' }}>
            <ReplayIcon sx={{ fontSize: 22 }} />
          </ListItemIcon>
          <ListItemText
            primary="다시보기"
            className="menu-label"
            primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }}
          />
        </ListItemButton>

        {/* 메시지 */}
        <ListItemButton
          component={Link}
          to="#"
          sx={getItemSx('message')}
          onClick={() => setActiveMenu('message')}
        >
          <ListItemIcon sx={{ minWidth: 0, justifyContent: 'center' }}>
            <MailOutlineIcon sx={{ fontSize: 22 }} />
          </ListItemIcon>
          <ListItemText
            primary="메시지"
            className="menu-label"
            primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }}
          />
        </ListItemButton>

        {/* 알림 */}
        <ListItemButton
          component={Link}
          to="#"
          sx={getItemSx('alarm')}
          onClick={() => setActiveMenu('alarm')}
        >
          <ListItemIcon sx={{ minWidth: 0, justifyContent: 'center' }}>
            <FavoriteBorderIcon sx={{ fontSize: 22 }} />
          </ListItemIcon>
          <ListItemText
            primary="알림"
            className="menu-label"
            primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }}
          />
        </ListItemButton>

        {/* 마이페이지 */}
        <ListItemButton
          component={Link}
          to="/mypage"
          sx={getItemSx('mypage')}
          onClick={() => setActiveMenu('mypage')}
        >
          <ListItemIcon sx={{ minWidth: 0, justifyContent: 'center' }}>
            <PersonOutlineIcon sx={{ fontSize: 22 }} />
          </ListItemIcon>
          <ListItemText
            primary="마이페이지"
            className="menu-label"
            primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }}
          />
        </ListItemButton>

        {/* 설정 */}
        <ListItemButton
          component={Link}
          to="#"
          sx={getItemSx('setting')}
          onClick={() => setActiveMenu('setting')}
        >
          <ListItemIcon sx={{ minWidth: 0, justifyContent: 'center' }}>
            <SettingsOutlinedIcon sx={{ fontSize: 22 }} />
          </ListItemIcon>
          <ListItemText
            primary="설정"
            className="menu-label"
            primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }}
          />
        </ListItemButton>
      </List>
    </Drawer>
  );
}

export default Menu;
