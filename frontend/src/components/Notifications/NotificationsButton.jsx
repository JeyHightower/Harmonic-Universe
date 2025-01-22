import NotificationsIcon from '@mui/icons-material/Notifications';
import {
  Badge,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Popover,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';

const NotificationsButton = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications] = useState([
    { id: 1, message: 'New collaboration request' },
    { id: 2, message: 'Your project was liked' },
  ]);

  const handleClick = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'notifications-popover' : undefined;

  return (
    <>
      <IconButton color="inherit" aria-describedby={id} onClick={handleClick}>
        <Badge badgeContent={notifications.length} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <List sx={{ width: 300, maxHeight: 400, overflow: 'auto' }}>
          {notifications.length > 0 ? (
            notifications.map(notification => (
              <ListItem key={notification.id} divider>
                <ListItemText primary={notification.message} />
              </ListItem>
            ))
          ) : (
            <ListItem>
              <ListItemText
                primary={
                  <Typography align="center">No new notifications</Typography>
                }
              />
            </ListItem>
          )}
        </List>
      </Popover>
    </>
  );
};

export default NotificationsButton;
