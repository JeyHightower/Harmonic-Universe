import { Suspense } from 'react';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import GlobalModal from './components/common/GlobalModal';
import { ModalProvider } from './contexts/ModalContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { router } from './routes';
import store from './store';
import './styles/global.css';

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <ModalProvider>
          <Suspense fallback={<div>Loading...</div>}>
            <RouterProvider router={router} />
            <GlobalModal />
            {/* Create a portal root for modals if it doesn't exist */}
            <div id="portal-root" />
          </Suspense>
        </ModalProvider>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
