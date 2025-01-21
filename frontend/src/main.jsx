// main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { store } from './redux/store';

// Enable future flags for React Router
const router = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  },
};

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(registration => {
        console.log(
          'ServiceWorker registration successful:',
          registration.scope
        );

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;

          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // New content is available, show update notification
              if (confirm('New version available! Would you like to update?')) {
                window.location.reload();
              }
            }
          });
        });
      })
      .catch(error => {
        console.error('ServiceWorker registration failed:', error);
      });
  });

  // Handle communication with the service worker
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data.type === 'CACHE_UPDATED') {
      // Handle cache updates
      console.log('Cache updated:', event.data.url);
    }
  });

  // Handle offline/online status
  window.addEventListener('online', () => {
    document.body.classList.remove('offline');
    // Trigger sync when back online
    navigator.serviceWorker.ready.then(registration => {
      registration.sync.register('sync-messages');
    });
  });

  window.addEventListener('offline', () => {
    document.body.classList.add('offline');
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter {...router}>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
