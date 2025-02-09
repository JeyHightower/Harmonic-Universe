import { CssBaseline, ThemeProvider } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { useRoutes } from 'react-router-dom';
import ErrorBoundary from './components/common/ErrorBoundary';
import routes from './routes';
import theme from './theme';

function App() {
  const routing = useRoutes(routes);

  return (
    <ThemeProvider theme={theme}>
      <SnackbarProvider maxSnack={3}>
        <CssBaseline />
        <ErrorBoundary>{routing}</ErrorBoundary>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
