import { Suspense } from 'react';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import Modal from './components/common/Modal';
import { ThemeProvider } from './contexts/ThemeContext';
import { router } from './routes';
import store from './store';
import './styles/global.css';

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <Suspense fallback={<div>Loading...</div>}>
          <RouterProvider router={router} />
          <Modal />
        </Suspense>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
