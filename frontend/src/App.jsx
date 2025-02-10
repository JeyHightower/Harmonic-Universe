import { Box } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { useState } from 'react';
import { useLocation, useRoutes } from 'react-router-dom';
import AudioContextProvider from './components/audio/AudioContextProvider';
import ErrorBoundary from './components/common/ErrorBoundary';
import Header from './components/layout/Header';
import routes from './routes';
import { ThemeProvider } from './theme/ThemeProvider';

function App() {
  const routing = useRoutes(routes);
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Only show header on non-dashboard routes
  const showHeader = !location.pathname.startsWith('/dashboard');

  return (
    <ThemeProvider>
      <SnackbarProvider
        maxSnack={3}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <ErrorBoundary>
          <AudioContextProvider>
            <Box sx={{
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              bgcolor: 'background.default',
              color: 'text.primary',
              transition: 'all 0.3s ease',
            }}>
              {showHeader && <Header onToggleSidebar={handleToggleSidebar} />}
              <Box component="main" sx={{ flexGrow: 1 }}>
                {routing}
              </Box>
            </Box>
          </AudioContextProvider>
        </ErrorBoundary>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
