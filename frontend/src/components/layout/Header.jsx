import { useAuth } from '@/hooks/useAuth';
import { logoutUserAsync } from '@/store/slices/authSlice';
import { commonStyles } from '@/styles/commonStyles';
import { useTheme } from '@/theme/ThemeProvider';
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
    useTheme as useMuiTheme,
} from '@mui/material';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import Logo from '../common/Logo';

const Header = ({ onToggleSidebar }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const muiTheme = useMuiTheme();
  const { mode, toggleTheme } = useTheme();
  const { isAuthenticated, user } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenu = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      handleClose();
      await dispatch(logoutUserAsync()).unwrap();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        zIndex: muiTheme.zIndex.drawer + 1,
        backgroundColor: muiTheme.palette.background.paper,
        color: muiTheme.palette.text.primary,
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={commonStyles.flexBetween}>
          {/* Left section */}
          <Box sx={commonStyles.flexCenter}>
            {isAuthenticated && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={onToggleSidebar}
                sx={{ display: { sm: 'none' }, mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            <RouterLink to="/" style={{ textDecoration: 'none' }}>
              <Logo variant={isAuthenticated ? 'small' : 'default'} />
            </RouterLink>
          </Box>

          {/* Right section */}
          <Box sx={commonStyles.flexCenter}>
            {/* Theme toggle */}
            <Tooltip title={mode === 'dark' ? 'Light mode' : 'Dark mode'}>
              <IconButton
                color="inherit"
                onClick={toggleTheme}
                sx={commonStyles.iconButton}
              >
                {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Tooltip>

            {!isAuthenticated ? (
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="outlined"
                  color="primary"
                  sx={commonStyles.button}
                >
                  Log In
                </Button>
                <Button
                  component={RouterLink}
                  to="/register"
                  variant="contained"
                  color="primary"
                  sx={commonStyles.button}
                >
                  Sign Up
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Tooltip title="Account settings">
                  <IconButton
                    color="inherit"
                    onClick={handleMenu}
                    sx={commonStyles.iconButton}
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
                    },
                  }}
                >
                  {user && (
                    <MenuItem sx={{ opacity: 0.6, cursor: 'default' }}>
                      {user.email}
                    </MenuItem>
                  )}
                  <MenuItem
                    component={RouterLink}
                    to="/dashboard/profile"
                    onClick={handleClose}
                  >
                    Profile
                  </MenuItem>
                  <MenuItem
                    component={RouterLink}
                    to="/dashboard/settings"
                    onClick={handleClose}
                  >
                    Settings
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>Logout</MenuItem>
                </Menu>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={handleLogout}
                  sx={{
                    ...commonStyles.button,
                    display: { xs: 'none', sm: 'flex' },
                  }}
                >
                  Logout
                </Button>
              </Box>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;
