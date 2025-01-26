import { Menu as MenuIcon } from '@mui/icons-material';
import { AppBar, Box, Container, IconButton, Toolbar, useMediaQuery, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';
import { useLocation } from 'react-router-dom';
import Logo from '../Common/Logo';
import Navigation from '../Navigation/Navigation';

const LayoutRoot = styled('div')(({ theme }) => ({
  display: 'flex',
  flex: '1 1 auto',
  maxWidth: '100%',
  paddingTop: 64,
  [theme.breakpoints.up('lg')]: {
    paddingLeft: 280,
  },
}));

const LayoutContainer = styled('div')({
  display: 'flex',
  flex: '1 1 auto',
  flexDirection: 'column',
  width: '100%',
});

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const theme = useTheme();
  const location = useLocation();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Close mobile drawer when route changes
  React.useEffect(() => {
    if (mobileOpen) {
      setMobileOpen(false);
    }
  }, [location.pathname]);

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          backgroundColor: 'background.paper',
          boxShadow: 'none',
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          left: {
            lg: 280,
          },
          width: {
            lg: 'calc(100% - 280px)',
          },
        }}
      >
        <Toolbar
          sx={{
            minHeight: 64,
            left: 0,
            px: 2,
          }}
        >
          <IconButton
            onClick={handleDrawerToggle}
            sx={{
              display: {
                lg: 'none',
              },
            }}
          >
            <MenuIcon />
          </IconButton>
          <Box
            sx={{
              display: {
                lg: 'none',
              },
              flexGrow: 1,
              justifyContent: 'center',
            }}
          >
            <Logo size="small" />
          </Box>
        </Toolbar>
      </AppBar>
      <Navigation
        onClose={() => setMobileOpen(false)}
        open={mobileOpen}
        variant={isDesktop ? 'permanent' : 'temporary'}
      />
      <LayoutRoot>
        <LayoutContainer>
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              py: 8,
              px: {
                xs: 2,
                sm: 3,
                lg: 4,
              },
            }}
          >
            <Container
              maxWidth="xl"
              sx={{
                px: {
                  lg: 8,
                },
              }}
            >
              {children}
            </Container>
          </Box>
        </LayoutContainer>
      </LayoutRoot>
    </>
  );
};

export default MainLayout;
