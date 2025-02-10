import { SnackbarProvider } from 'notistack';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AudioContextProvider from './components/audio/AudioContextProvider';
import ErrorBoundary from './components/common/ErrorBoundary';
import routes from './routes';
import { ThemeProvider } from './theme/ThemeProvider';

// Create router with future flags enabled
const router = createBrowserRouter(routes, {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
});

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <SnackbarProvider
          maxSnack={3}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          autoHideDuration={3000}
          preventDuplicate
        >
          <AudioContextProvider>
            <RouterProvider router={router} />
          </AudioContextProvider>
        </SnackbarProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
