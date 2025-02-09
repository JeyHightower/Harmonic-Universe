import MenuIcon from '@mui/icons-material/Menu';
import { AppBar, Box, Button, Container, IconButton, Toolbar } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Logo from '../common/Logo';

const Header = ({ onToggleSidebar }) => {
  const { isAuthenticated, logout } = useAuth();

  return (
    <AppBar position="fixed" elevation={0}>
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
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

          <Box sx={{ display: 'flex', gap: 2 }}>
            {!isAuthenticated ? (
              <>
                <Button component={RouterLink} to="/login" variant="outlined" color="primary">
                  Log In
                </Button>
                <Button component={RouterLink} to="/register" variant="contained" color="primary">
                  Sign Up
                </Button>
              </>
            ) : (
              <Button
                variant="outlined"
                color="primary"
                onClick={logout}
                sx={{
                  borderWidth: '2px',
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  fontWeight: 600,
                  '&:hover': {
                    borderWidth: '2px',
                    borderColor: 'primary.dark',
                    backgroundColor: 'primary.main',
                    color: 'white',
                  },
                  transition: theme =>
                    theme.transitions.create(['background-color', 'border-color', 'color'], {
                      duration: theme.transitions.duration.short,
                    }),
                }}
              >
                Log Out
              </Button>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;
