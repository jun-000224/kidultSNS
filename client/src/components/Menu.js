// src/components/Menu.js
import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton
} from '@mui/material';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import SurfingIcon from '@mui/icons-material/Surfing';
import SearchIcon from '@mui/icons-material/Search';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import { Link } from 'react-router-dom';

function Menu() {
  // 사이드 메뉴 전체 너비
  const drawerWidth = 170;

  // 현재 선택된 메뉴 상태
  const [activeMenu, setActiveMenu] = useState('home');

  // 파도타기 도움말 모달 열림 여부
  const [openSurfHelp, setOpenSurfHelp] = useState(false);

  // 공통 메뉴 스타일
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
    // 선택된 메뉴는 항상 호버 상태 유지
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
          alignItems: 'center',
          paddingY: 1.5,
          marginLeft: 2
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
          gap: 3.5,
          overflow: 'hidden',
          pt: 0.5,
          marginTop: 15
        }}
      >
        {/* 홈 */}
        <ListItemButton
          component={Link}
          to="/feedAll"
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
          to="/feed"
          sx={getItemSx('surf')}
          onClick={() => setActiveMenu('surf')}
        >
          <ListItemIcon sx={{ minWidth: 0, justifyContent: 'center' }}>
            <SurfingIcon sx={{ fontSize: 22 }} />
          </ListItemIcon>

          {/* 텍스트와 물음표 버튼을 한 줄로 배치 */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <ListItemText
              primary="파도타기"
              className="menu-label"
              primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }}
            />
            <IconButton
              size="small"
              className="menu-label"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpenSurfHelp(true);
              }}
            >
              <HelpOutlineIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </ListItemButton>

        {/* 다시보기(북마크 모아보기) */}
        <ListItemButton
          component={Link}
          to="/bookmark"
          sx={getItemSx('bookmark')}
          onClick={() => setActiveMenu('bookmark')}
        >
          <ListItemIcon sx={{ minWidth: 0, justifyContent: 'center' }}>
            <BookmarkBorderIcon sx={{ fontSize: 22 }} />
          </ListItemIcon>
          <ListItemText
            primary="다시보기"
            className="menu-label"
            primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }}
          />
        </ListItemButton>

        {/* 검색 */}
        {/* <ListItemButton
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
        </ListItemButton> */}

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

      {/* 파도타기 설명 모달 */}
      <Dialog
        open={openSurfHelp}
        onClose={() => setOpenSurfHelp(false)}
      >
        <DialogTitle>🌊 파도타기란?</DialogTitle>
        <DialogContent>
          모든 게시글을 무작위로 보여줍니다.
          <br />
          파도를 타고 취미의 시야를 넓혀보세요!
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSurfHelp(false)}>
            닫기
          </Button>
        </DialogActions>
      </Dialog>
    </Drawer>
  );
}

export default Menu;
