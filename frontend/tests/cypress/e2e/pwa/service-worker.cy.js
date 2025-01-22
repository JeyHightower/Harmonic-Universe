describe('PWA and Service Worker', () => {
  beforeEach(() => {
    // Mock service worker registration
    cy.intercept('GET', '/service-worker.js', {
      statusCode: 200,
      fixture: 'service-worker.js',
    }).as('getServiceWorker');

    // Mock monitoring configuration
    cy.intercept('GET', '/api/monitoring/config', {
      statusCode: 200,
      body: {
        appVersion: '1.0.0',
        environment: 'test',
      },
    }).as('getMonitoringConfig');

    // Mock analytics endpoint
    cy.intercept('POST', '/api/analytics', {
      statusCode: 201,
      body: { message: 'Metrics recorded successfully' },
    }).as('recordMetrics');

    cy.visit('/');
  });

  describe('Service Worker Registration', () => {
    it('should register service worker successfully', () => {
      cy.window().then(win => {
        expect(win.navigator.serviceWorker.controller).to.exist;
      });

      cy.wait('@recordMetrics').then(interception => {
        expect(interception.request.body).to.deep.include({
          name: 'sw_registration',
          value: 1,
          tags: {
            type: 'service_worker',
            status: 'success',
          },
        });
      });
    });

    it('should handle service worker updates', () => {
      cy.window().then(win => {
        // Simulate service worker update
        win.dispatchEvent(new CustomEvent('sw-update-available'));
      });

      // Verify update prompt
      cy.get('[data-testid="sw-update-prompt"]')
        .should('be.visible')
        .and('contain', 'New version available');

      // Accept update
      cy.get('[data-testid="sw-update-accept"]').click();

      cy.wait('@recordMetrics').then(interception => {
        expect(interception.request.body).to.deep.include({
          name: 'pwa_update_accepted',
          value: 1,
        });
      });
    });

    it('should handle service worker errors', () => {
      cy.window().then(win => {
        // Simulate registration error
        win.dispatchEvent(
          new CustomEvent('sw-error', {
            detail: { message: 'Registration failed' },
          })
        );
      });

      cy.wait('@recordMetrics').then(interception => {
        expect(interception.request.body).to.deep.include({
          name: 'sw_error',
          value: 1,
          tags: {
            type: 'registration_error',
          },
        });
      });
    });
  });

  describe('Cache Management', () => {
    it('should cache static assets', () => {
      // Visit page to trigger caching
      cy.visit('/');

      // Verify assets are cached
      cy.window().then(win => {
        win.caches.keys().then(cacheNames => {
          expect(cacheNames).to.include('static-assets');
        });

        win.caches.open('static-assets').then(cache => {
          cache.keys().then(requests => {
            expect(requests.some(req => req.url.includes('.css'))).to.be.true;
            expect(requests.some(req => req.url.includes('.js'))).to.be.true;
          });
        });
      });
    });

    it('should handle cache cleanup on activation', () => {
      cy.window().then(win => {
        // Add old cache
        win.caches
          .open('harmonic-universe-old')
          .then(cache => cache.put('/', new Response()));

        // Simulate activation
        win.dispatchEvent(new CustomEvent('sw-activate'));

        // Verify old cache is removed
        win.caches.keys().then(cacheNames => {
          expect(cacheNames).not.to.include('harmonic-universe-old');
        });
      });
    });
  });

  describe('Offline Functionality', () => {
    it('should handle offline mode for static assets', () => {
      // Load page normally first
      cy.visit('/');

      // Go offline and reload
      cy.window().then(win => {
        win.dispatchEvent(new Event('offline'));
      });

      // Verify static assets are served from cache
      cy.get('img[src="/assets/logo.png"]').should('be.visible');
      cy.get('link[rel="stylesheet"]').should('exist');
    });

    it('should queue API requests when offline', () => {
      // Go offline
      cy.window().then(win => {
        win.dispatchEvent(new Event('offline'));
      });

      // Attempt API request
      cy.window().then(win => {
        win.fetch('/api/universes', {
          method: 'POST',
          body: JSON.stringify({ name: 'Test Universe' }),
        });
      });

      // Verify request is queued
      cy.window().then(win => {
        win.indexedDB.open('harmonic-universe-db').onsuccess = event => {
          const db = event.target.result;
          const tx = db.transaction('offlineActions', 'readonly');
          const store = tx.objectStore('offlineActions');
          store.count().onsuccess = e => {
            expect(e.target.result).to.be.at.least(1);
          };
        };
      });
    });

    it('should sync queued requests when back online', () => {
      // Queue offline request
      cy.window().then(win => {
        win.dispatchEvent(new Event('offline'));
        win.fetch('/api/universes', {
          method: 'POST',
          body: JSON.stringify({ name: 'Test Universe' }),
        });
      });

      // Go back online
      cy.window().then(win => {
        win.dispatchEvent(new Event('online'));
      });

      // Verify sync is triggered
      cy.wait('@recordMetrics').then(interception => {
        expect(interception.request.body).to.deep.include({
          name: 'sw_sync_completed',
          value: 1,
        });
      });
    });
  });

  describe('Push Notifications', () => {
    it('should handle push notification subscription', () => {
      cy.window().then(win => {
        win.Notification = {
          permission: 'granted',
          requestPermission: () => Promise.resolve('granted'),
        };

        // Simulate push subscription
        win.navigator.serviceWorker.ready.then(registration => {
          registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: 'test-key',
          });
        });
      });

      cy.wait('@recordMetrics').then(interception => {
        expect(interception.request.body).to.deep.include({
          name: 'push_subscription',
          value: 1,
          tags: {
            status: 'success',
          },
        });
      });
    });

    it('should handle push notification display', () => {
      cy.window().then(win => {
        // Simulate receiving push notification
        win.dispatchEvent(
          new CustomEvent('push', {
            detail: {
              title: 'Test Notification',
              options: {
                body: 'Test message',
                icon: '/assets/icons/icon-192x192.png',
              },
            },
          })
        );
      });

      // Verify notification is displayed
      cy.get('[data-testid="notification"]')
        .should('be.visible')
        .and('contain', 'Test Notification');
    });
  });

  describe('Installation Experience', () => {
    it('should show install prompt', () => {
      cy.window().then(win => {
        // Simulate beforeinstallprompt event
        const event = new CustomEvent('beforeinstallprompt');
        event.prompt = () => Promise.resolve();
        event.userChoice = Promise.resolve({ outcome: 'accepted' });
        win.dispatchEvent(event);
      });

      // Verify install prompt is shown
      cy.get('[data-testid="install-prompt"]')
        .should('be.visible')
        .and('contain', 'Install App');

      // Click install button
      cy.get('[data-testid="install-button"]').click();

      cy.wait('@recordMetrics').then(interception => {
        expect(interception.request.body).to.deep.include({
          name: 'pwa_install_result',
          value: 1,
          tags: {
            outcome: 'accepted',
          },
        });
      });
    });

    it('should track installation events', () => {
      cy.window().then(win => {
        // Simulate app installed event
        win.dispatchEvent(new CustomEvent('appinstalled'));
      });

      cy.wait('@recordMetrics').then(interception => {
        expect(interception.request.body).to.deep.include({
          name: 'pwa_installed',
          value: 1,
        });
      });
    });
  });
});
