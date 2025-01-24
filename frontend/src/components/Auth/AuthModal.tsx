import useAuth from '@/hooks/useAuth';
import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Dialog,
  DialogContent,
  IconButton,
  Tab,
  Tabs,
} from '@mui/material';
import React from 'react';
import ForgotPasswordForm from './ForgotPasswordForm';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

const AuthModal: React.FC = () => {
  const {
    showAuthModal,
    authModalView,
    handleCloseAuthModal,
    handleSwitchAuthView,
  } = useAuth();

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    handleSwitchAuthView(newValue as 'login' | 'register' | 'forgot-password');
  };

  return (
    <Dialog
      open={showAuthModal}
      onClose={handleCloseAuthModal}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        elevation: 0,
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          p: 1,
        }}
      >
        <IconButton
          edge="end"
          color="inherit"
          onClick={handleCloseAuthModal}
          aria-label="close"
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {authModalView !== 'forgot-password' && (
        <Tabs
          value={authModalView}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Login" value="login" />
          <Tab label="Register" value="register" />
        </Tabs>
      )}

      <DialogContent>
        {authModalView === 'login' && <LoginForm />}
        {authModalView === 'register' && <RegisterForm />}
        {authModalView === 'forgot-password' && <ForgotPasswordForm />}
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
