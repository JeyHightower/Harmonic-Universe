describe('PWA Features', () => {
  beforeEach(() => {
    // Start with a clean slate
    cy.clearLocalStorage();
    cy.clearServiceWorkers();

    // Visit the app
    cy.visit('/');
  });

  it('registers service worker successfully', () => {
    // Check if service worker is registered
    cy.window().then(win => {
      expect(win.navigator.serviceWorker.controller).to.exist;
    });
  });

  it('works offline', () => {
    // Visit the universes page and wait for it to load
    cy.visit('/universes');
    cy.contains('h1', 'Universes').should('be.visible');

    // Wait for service worker to be ready
    cy.window().then(win => {
      return new Promise(resolve => {
        if (win.navigator.serviceWorker.controller) {
          resolve();
        } else {
          win.navigator.serviceWorker.addEventListener(
            'controllerchange',
            resolve
          );
        }
      });
    });

    // Go offline
    cy.goOffline();

    // Reload the page
    cy.reload();

    // Should still show the universes page
    cy.contains('h1', 'Universes').should('be.visible');

    // Go back online
    cy.goOnline();
  });

  it('shows analytics data', () => {
    // Visit analytics page
    cy.visit('/analytics');

    // Should show the analytics dashboard
    cy.contains('h1', 'Analytics Dashboard').should('be.visible');

    // Should show metrics selector
    cy.get('select').should('exist');

    // Should show some metrics data
    cy.get('[class*="stats"]').should('exist');
    cy.get('[class*="chart"]').should('exist');
  });

  it('handles offline analytics tracking', () => {
    // Visit analytics page
    cy.visit('/analytics');

    // Go offline
    cy.goOffline();

    // Switch between metrics (triggers analytics events)
    cy.get('select').select('service_worker');

    // Check local storage for stored metrics
    cy.window().then(win => {
      const failedMetrics = JSON.parse(
        win.localStorage.getItem('failed_metrics') || '[]'
      );
      expect(failedMetrics.length).to.be.greaterThan(0);
    });

    // Go back online
    cy.goOnline();

    // Wait for metrics to be sent
    cy.wait(1000);

    // Failed metrics should be cleared
    cy.window().then(win => {
      const failedMetrics = JSON.parse(
        win.localStorage.getItem('failed_metrics') || '[]'
      );
      expect(failedMetrics.length).to.equal(0);
    });
  });

  it('caches assets for offline use', () => {
    // Visit the app and wait for service worker
    cy.visit('/');
    cy.window().then(win => {
      return new Promise(resolve => {
        if (win.navigator.serviceWorker.controller) {
          resolve();
        } else {
          win.navigator.serviceWorker.addEventListener(
            'controllerchange',
            resolve
          );
        }
      });
    });

    // Check cache storage
    cy.window().then(win => {
      return win.caches.keys().then(cacheNames => {
        expect(cacheNames.length).to.be.greaterThan(0);
      });
    });

    // Go offline
    cy.goOffline();

    // Navigate to different pages
    cy.visit('/universes');
    cy.contains('h1', 'Universes').should('be.visible');

    cy.visit('/analytics');
    cy.contains('h1', 'Analytics Dashboard').should('be.visible');

    // Go back online
    cy.goOnline();
  });

  it('updates service worker', () => {
    // Mock a service worker update
    cy.window().then(win => {
      const registration = win.navigator.serviceWorker.controller;
      if (registration) {
        // Trigger update found
        const event = new Event('updatefound');
        registration.dispatchEvent(event);

        // Should show update prompt
        cy.contains('New version available').should('be.visible');
      }
    });
  });
});

// Add custom commands
Cypress.Commands.add('clearServiceWorkers', () => {
  cy.window().then(win => {
    return win.navigator.serviceWorker
      .getRegistrations()
      .then(registrations => {
        return Promise.all(
          registrations.map(registration => registration.unregister())
        );
      });
  });
});

Cypress.Commands.add('goOffline', () => {
  cy.log('**go offline**');
  cy.window().then(win => {
    win.dispatchEvent(new Event('offline'));
  });
});

Cypress.Commands.add('goOnline', () => {
  cy.log('**go online**');
  cy.window().then(win => {
    win.dispatchEvent(new Event('online'));
  });
});
