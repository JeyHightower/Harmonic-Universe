import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import MenuIcon from '@mui/icons-material/Menu';
import {
  AppBar,
  Box,
  Button,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  useTheme,
} from '@mui/material';
import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme as useAppTheme } from '../../hooks/useTheme';
import Logo from '../common/Logo';

const Header = ({ onToggleSidebar }) => {
  const theme = useTheme();
  const { toggleTheme } = useAppTheme();
  const { isAuthenticated, user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenu = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    logout();
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        zIndex: theme.zIndex.drawer + 1,
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
          {/* Left section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {isAuthenticated && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={onToggleSidebar}
                sx={{ display: { sm: 'none' } }}
              >
                <MenuIcon />
              </IconButton>
            )}
            <RouterLink to="/" style={{ textDecoration: 'none' }}>
              <Logo variant={isAuthenticated ? 'small' : 'default'} />
            </RouterLink>
          </Box>

          {/* Right section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Theme toggle */}
            <Tooltip title={theme.palette.mode === 'dark' ? 'Light mode' : 'Dark mode'}>
              <IconButton color="inherit" onClick={toggleTheme} sx={{ ml: 1 }}>
                {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Tooltip>

            {!isAuthenticated ? (
              <>
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="outlined"
                  color="primary"
                  sx={{
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    '&:hover': {
                      borderColor: 'primary.light',
                      backgroundColor: 'primary.dark',
                      color: 'common.white',
                    },
                  }}
                >
                  Log In
                </Button>
                <Button
                  component={RouterLink}
                  to="/register"
                  variant="contained"
                  color="primary"
                  sx={{
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                  }}
                >
                  Sign Up
                </Button>
              </>
            ) : (
              <>
                <Tooltip title="Account settings">
                  <IconButton
                    color="inherit"
                    onClick={handleMenu}
                    sx={{
                      ml: 2,
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <AccountCircleIcon />
                  </IconButton>
                </Tooltip>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  PaperProps={{
                    elevation: 0,
                    sx: {
                      overflow: 'visible',
                      filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                      mt: 1.5,
                      '& .MuiAvatar-root': {
                        width: 32,
                        height: 32,
                        ml: -0.5,
                        mr: 1,
                      },
                    },
                  }}
                >
                  {user && (
                    <MenuItem sx={{ opacity: 0.6, cursor: 'default' }}>
                      Signed in as {user.email}
                    </MenuItem>
                  )}
                  <MenuItem component={RouterLink} to="/profile">
                    Profile
                  </MenuItem>
                  <MenuItem component={RouterLink} to="/settings">
                    Settings
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>Logout</MenuItem>
                </Menu>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={logout}
                  sx={{
                    display: { xs: 'none', sm: 'flex' },
                    borderColor: 'divider',
                    '&:hover': {
                      borderColor: 'primary.light',
                      backgroundColor: 'primary.dark',
                      color: 'common.white',
                    },
                  }}
                >
                  Logout
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;
