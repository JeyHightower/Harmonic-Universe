import { CssBaseline, ThemeProvider } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { useRoutes } from 'react-router-dom';
import AudioContextProvider from './components/audio/AudioContextProvider';
import ErrorBoundary from './components/common/ErrorBoundary';
import Header from './components/layout/Header';
import routes from './routes';
import getTheme from './theme';

function App() {
  const routing = useRoutes(routes);
  const theme = getTheme('light'); // Create theme with light mode

  return (
    <ThemeProvider theme={theme}>
      <SnackbarProvider maxSnack={3}>
        <CssBaseline />
        <ErrorBoundary>
          <AudioContextProvider>
            <Header />
            {routing}
          </AudioContextProvider>
        </ErrorBoundary>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
