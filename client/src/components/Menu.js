// src/components/Menu.js
import React, { useState, useEffect } from 'react';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListItem,
  ListItemAvatar,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Avatar,
  Badge
} from '@mui/material';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import SurfingIcon from '@mui/icons-material/Surfing';
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

  // 파도타기 도움말 모달
  const [openSurfHelp, setOpenSurfHelp] = useState(false);

  // 알림 모달
  const [openAlarm, setOpenAlarm] = useState(false);

  // 알림 리스트
  const [notifications, setNotifications] = useState([]);

  // 안 읽은 알림 개수
  const [notificationCnt, setNotificationCnt] = useState(0);

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
    '& .menu-label': {
      opacity: 0,
      maxWidth: 0,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      transition: 'all 0.2s ease'
    },
    '&:hover .menu-label': {
      opacity: 1,
      maxWidth: 140,
      ml: 1.4
    },
    ...(activeMenu === key && {
      backgroundColor: '#f3f4f6',
      '& .menu-label': {
        opacity: 1,
        maxWidth: 140,
        ml: 1.4
      }
    })
  });

  // 알림 리스트 조회 + 미읽음 개수 계산
  const fetchNotifications = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch('http://localhost:3010/notification', {
        headers: {
          Authorization: 'Bearer ' + token
        }
      });

      const data = await res.json();
      console.log('notification list ==> ', data);

      if (data.result === 'success') {
        const list = data.list || [];
        setNotifications(list);

        // isRead 값이 0인 것만 미읽음으로 계산
        const unread = list.filter((n) => n.isRead === 0 || n.isRead === '0')
          .length;
        setNotificationCnt(unread);
      }
    } catch (err) {
      console.log('fetchNotifications error ==> ', err);
    }
  };

  // 알림 전체 읽음 처리
  const readAllNotifications = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch('http://localhost:3010/notification/read-all', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + token
        }
      });
      const data = await res.json();
      console.log('read-all ==> ', data);

      if (data.result === 'success') {
        // 전부 읽음 처리 후, 다시 리스트를 가져와서 상태 동기화
        await fetchNotifications();
      }
    } catch (err) {
      console.log('readAllNotifications error ==> ', err);
    }
  };

  // 최초 로딩 + 일정 간격으로 알림 리스트/카운트 갱신
  useEffect(() => {
    // 처음 한 번
    fetchNotifications();

    // 5초마다 한 번씩 서버에 알림 리스트 요청
    const intervalId = setInterval(() => {
      fetchNotifications();
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

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

        {/* 메시지 */}
        <ListItemButton
          component={Link}
          to="#"
          sx={getItemSx('message')}
          onClick={() => {
            setActiveMenu('message');
            alert('메시지 오픈 준비중입니다.');
          }}
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
          onClick={async () => {
            setActiveMenu('alarm');
            // 리스트는 이미 주기적으로 가져오고 있으니,
            // 모달 열고 전체 읽음 처리만 수행
            setOpenAlarm(true);
            await readAllNotifications();
          }}
        >
          <ListItemIcon sx={{ minWidth: 0, justifyContent: 'center' }}>
            <Badge
              badgeContent={notificationCnt ?? 0}
              color="error"
              overlap="circular"
              showZero
            >
              <FavoriteBorderIcon sx={{ fontSize: 22 }} />
            </Badge>
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
          to="/Setting"
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
        <DialogTitle>파도타기란?</DialogTitle>
        <DialogContent>
          모든 게시글을 무작위로 보여줍니다.
          <br />
          파도를 타고 취미의 시야를 넓혀보세요.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSurfHelp(false)}>
            닫기
          </Button>
        </DialogActions>
      </Dialog>

      {/* 알림 리스트 모달 */}
      <Dialog
        open={openAlarm}
        onClose={() => setOpenAlarm(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>알림</DialogTitle>
        <DialogContent dividers>
          {notifications.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              아직 도착한 알림이 없습니다.
            </Typography>
          )}

          <List>
            {notifications.map((n) => (
              <ListItem key={n.notiId}>
                <ListItemAvatar>
                  <Avatar
                    src={
                      n.senderProfileImgPath
                        ? 'http://localhost:3010' + n.senderProfileImgPath
                        : undefined
                    }
                  >
                    {(n.senderName || n.senderId || 'U')
                      .toString()
                      .charAt(0)
                      .toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    n.type === 'LIKE'
                      ? `${n.senderName || n.senderId} 님이 회원님의 게시글을 좋아합니다.`
                      : n.type === 'FOLLOW'
                      ? `${n.senderName || n.senderId} 님이 회원님을 팔로우하기 시작했습니다.`
                      : `${n.senderName || n.senderId} 님의 알림`
                  }
                  secondary={
                    <>
                      {n.feedTitle && (
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.primary"
                        >
                          {n.feedTitle}
                        </Typography>
                      )}
                      {n.cdatetime ? ` · ${n.cdatetime}` : ''}
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAlarm(false)}>닫기</Button>
        </DialogActions>
      </Dialog>
    </Drawer>
  );
}

export default Menu;
