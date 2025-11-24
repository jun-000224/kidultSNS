import React from 'react';
import { Drawer, List, ListItem, ListItemText, Typography, Toolbar, ListItemIcon } from '@mui/material';
import { Home, Add, AccountCircle } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import Mui from './Mui';

function Menu() {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240, // 너비 설정
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 240, // Drawer 내부의 너비 설정
          boxSizing: 'border-box',
        },
      }}
    >
      <Toolbar />
      <Typography variant="h6" component="div" sx={{ p: 2 }}>
        SNS 메뉴
      </Typography>
      <List>
        <ListItem button component={Link} to="/feed">
          <ListItemIcon>
            <Home />
          </ListItemIcon>
          <ListItemText primary="피드" />
        </ListItem>
        <ListItem button component={Link} to="/register">
          <ListItemIcon>
            <Add />
          </ListItemIcon>
          <ListItemText primary="등록" />
        </ListItem>
        <ListItem button component={Link} to="/mypage">
          <ListItemIcon>
            <AccountCircle />
          </ListItemIcon>
          <ListItemText primary="마이페이지" />
        </ListItem>

<<<<<<< HEAD
        <ListItem button component={Link} to="/Mui">
=======
        <ListItem button component={Link} to="/mui">
>>>>>>> b1e27c0d9d7bab1705a5d12686ff62f70746639a
          <ListItemIcon>
            <Home />
          </ListItemIcon>
          <ListItemText primary="mui테스트" />
        </ListItem>
<<<<<<< HEAD
=======

>>>>>>> b1e27c0d9d7bab1705a5d12686ff62f70746639a
      </List>
    </Drawer>
  );
};

export default Menu;