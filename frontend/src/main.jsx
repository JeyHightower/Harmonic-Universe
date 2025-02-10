import App from '@/App';
import { ModalProvider } from '@/contexts/ModalContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import '@/index.css';
import { store } from '@/store';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <ModalProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ModalProvider>
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
);
