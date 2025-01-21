import { monitoring } from './services/monitoring';

export function register() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = '/service-worker.js';

      registerValidSW(swUrl);
    });
  }
}

function registerValidSW(swUrl) {
  navigator.serviceWorker
    .register(swUrl)
    .then(registration => {
      monitoring.trackServiceWorker('registration', true);

      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }

        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New content is available
              monitoring.trackUpdate(registration.active.scriptURL);

              // Show update prompt to user
              if (
                window.confirm(
                  'New version available! Would you like to update?'
                )
              ) {
                window.location.reload();
              }
            } else {
              // First time installation
              monitoring.trackServiceWorker('installation', true);
              console.log('Content is cached for offline use.');
            }
          }
        };
      };
    })
    .catch(error => {
      monitoring.trackServiceWorker('registration', false, error);
      console.error('Error during service worker registration:', error);
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(registration => {
        registration.unregister();
        monitoring.trackServiceWorker('unregistration', true);
      })
      .catch(error => {
        monitoring.trackServiceWorker('unregistration', false, error);
        console.error('Error during service worker unregistration:', error);
      });
  }
}
