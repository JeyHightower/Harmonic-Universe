// main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { getCLS, getFCP, getFID, getLCP, getTTFB } from 'web-vitals';
import App from './App';
import './index.css';
import { monitoring } from './services/monitoring';
import store from './store';

// Initialize monitoring with error tracking
monitoring
  .init({
    appVersion: import.meta.env.VITE_APP_VERSION,
    environment: import.meta.env.MODE,
    analyticsEndpoint: '/api/analytics',
    errorEndpoint: '/api/errors',
    onError: error => {
      // Global error handler for uncaught errors
      console.error('Uncaught error:', error);

      // If we have access to the notification system, show the error
      const notificationContainer = document.querySelector(
        '.notification-container'
      );
      if (notificationContainer) {
        const errorEvent = new CustomEvent('show-error', {
          detail: {
            message: 'An unexpected error occurred',
            details: error.message,
            category: 'UNCAUGHT_ERROR',
          },
        });
        window.dispatchEvent(errorEvent);
      }
    },
  })
  .startTracking();

// Report web vitals
function reportWebVitals(metric) {
  monitoring.trackPerformance(`performance_${metric.name}`, metric.value, {
    id: metric.id,
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    navigationType: metric.navigationType,
    entries: JSON.stringify(metric.entries),
  });
}

// Initialize web vitals
getCLS(reportWebVitals);
getFID(reportWebVitals);
getLCP(reportWebVitals);
getTTFB(reportWebVitals);
getFCP(reportWebVitals);

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register(
        '/service-worker.js'
      );
      console.log('Service worker registered:', registration.scope);

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;

        newWorker.addEventListener('statechange', () => {
          if (
            newWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            // New version available - show notification
            const updateEvent = new CustomEvent('show-info', {
              detail: {
                message: 'A new version is available!',
                details: 'Would you like to update now?',
                category: 'UPDATE_AVAILABLE',
                duration: null, // Don't auto-dismiss
                onAction: () => {
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  window.location.reload();
                },
              },
            });
            window.dispatchEvent(updateEvent);
          }
        });
      });
    } catch (error) {
      console.error('Service worker registration failed:', error);
      const errorEvent = new CustomEvent('show-error', {
        detail: {
          message: 'Service Worker Registration Failed',
          details: error.message,
          category: 'SERVICE_WORKER_ERROR',
        },
      });
      window.dispatchEvent(errorEvent);
    }
  });

  // Handle controller change
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}

// Update online/offline status
function updateOnlineStatus() {
  const isOnline = navigator.onLine;
  document.body.classList.toggle('offline', !isOnline);

  // Show notification when connection status changes
  const event = new CustomEvent(isOnline ? 'show-success' : 'show-warning', {
    detail: {
      message: isOnline ? 'Back Online' : 'Connection Lost',
      details: isOnline
        ? 'Your internet connection has been restored'
        : 'Please check your internet connection',
      category: 'CONNECTIVITY',
      duration: 3000,
    },
  });
  window.dispatchEvent(event);
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
