describe('Storage and Background Sync', () => {
  beforeEach(() => {
    // Clear storage before each test
    cy.window().then(win => {
      win.localStorage.clear();
      win.indexedDB.deleteDatabase('harmonic-universe-db');
    });

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

  describe('Local Storage', () => {
    it('should handle storyboard preferences storage', () => {
      const universeId = 1;
      const preferences = {
        pagination: { perPage: 20 },
        sort: { field: 'title', order: 'asc' },
        filters: { search: 'test', harmonyMin: 0.5, harmonyMax: 1.0 },
      };

      cy.window().then(win => {
        // Set preferences
        const result = win.storage.setStoryboardPreferences(
          universeId,
          preferences
        );
        expect(result).to.be.true;

        // Get preferences
        const stored = win.storage.getStoryboardPreferences(universeId);
        expect(stored).to.deep.equal(preferences);
      });
    });

    it('should handle storyboard draft storage', () => {
      const universeId = 1;
      const draft = {
        title: 'Draft Story',
        content: 'Test content',
        timestamp: Date.now(),
      };

      cy.window().then(win => {
        // Set draft
        const result = win.storage.setStoryboardDraft(universeId, draft);
        expect(result).to.be.true;

        // Get draft
        const stored = win.storage.getStoryboardDraft(universeId);
        expect(stored).to.deep.equal(draft);

        // Clear draft
        const cleared = win.storage.clearStoryboardDraft(universeId);
        expect(cleared).to.be.true;
        expect(win.storage.getStoryboardDraft(universeId)).to.be.null;
      });
    });

    it('should handle storage errors gracefully', () => {
      cy.window().then(win => {
        // Simulate storage being full
        const hugeString = 'a'.repeat(10 * 1024 * 1024); // 10MB string

        // Attempt to store large data
        const result = win.storage.setItem('huge', hugeString);
        expect(result).to.be.false;

        // Verify error handling for other operations
        const getResult = win.storage.getItem('nonexistent');
        expect(getResult).to.be.null;
      });
    });

    it('should handle storage quota exceeded', () => {
      cy.window().then(win => {
        // Mock storage quota exceeded
        const originalSetItem = win.localStorage.setItem;
        win.localStorage.setItem = () => {
          throw new Error('QuotaExceededError');
        };

        const result = win.storage.setItem('test', 'data');
        expect(result).to.be.false;

        // Restore original setItem
        win.localStorage.setItem = originalSetItem;
      });
    });
  });

  describe('IndexedDB Storage', () => {
    it('should initialize IndexedDB database', () => {
      cy.window().then(win => {
        const dbRequest = win.indexedDB.open('harmonic-universe-db', 1);

        dbRequest.onsuccess = event => {
          const db = event.target.result;
          expect(db.objectStoreNames).to.contain('notifications');
          expect(db.objectStoreNames).to.contain('offlineActions');
          db.close();
        };
      });
    });

    it('should store offline actions', () => {
      cy.window().then(win => {
        const action = {
          type: 'universe_update',
          data: { id: 1, name: 'Updated Universe' },
          timestamp: Date.now(),
        };

        // Store offline action
        const dbRequest = win.indexedDB.open('harmonic-universe-db', 1);
        dbRequest.onsuccess = event => {
          const db = event.target.result;
          const tx = db.transaction('offlineActions', 'readwrite');
          const store = tx.objectStore('offlineActions');

          store.add(action).onsuccess = () => {
            // Verify action was stored
            store.count().onsuccess = e => {
              expect(e.target.result).to.equal(1);
            };
          };
        };
      });
    });

    it('should handle notifications storage', () => {
      cy.window().then(win => {
        const notification = {
          title: 'Test Notification',
          message: 'Test message',
          timestamp: Date.now(),
          read: false,
        };

        // Store notification
        const dbRequest = win.indexedDB.open('harmonic-universe-db', 1);
        dbRequest.onsuccess = event => {
          const db = event.target.result;
          const tx = db.transaction('notifications', 'readwrite');
          const store = tx.objectStore('notifications');

          store.add(notification).onsuccess = () => {
            // Verify notification was stored
            store.index('read').count(0).onsuccess = e => {
              expect(e.target.result).to.equal(1);
            };
          };
        };
      });
    });
  });

  describe('Background Sync', () => {
    it('should queue offline actions', () => {
      // Go offline
      cy.window().then(win => {
        win.dispatchEvent(new Event('offline'));
      });

      // Attempt universe update
      cy.window().then(win => {
        const action = {
          type: 'universe_update',
          data: { id: 1, name: 'Updated Universe' },
        };

        // Store in IndexedDB
        const dbRequest = win.indexedDB.open('harmonic-universe-db', 1);
        dbRequest.onsuccess = event => {
          const db = event.target.result;
          const tx = db.transaction('offlineActions', 'readwrite');
          const store = tx.objectStore('offlineActions');

          store.add(action).onsuccess = () => {
            // Verify action was queued
            store.count().onsuccess = e => {
              expect(e.target.result).to.equal(1);
            };
          };
        };
      });
    });

    it('should process sync queue when online', () => {
      // Add offline action
      cy.window().then(win => {
        const action = {
          type: 'universe_update',
          data: { id: 1, name: 'Updated Universe' },
          timestamp: Date.now(),
        };

        const dbRequest = win.indexedDB.open('harmonic-universe-db', 1);
        dbRequest.onsuccess = event => {
          const db = event.target.result;
          const tx = db.transaction('offlineActions', 'readwrite');
          const store = tx.objectStore('offlineActions');
          store.add(action);
        };
      });

      // Go online and process queue
      cy.window().then(win => {
        win.dispatchEvent(new Event('online'));
      });

      // Verify sync was triggered
      cy.wait('@recordMetrics').then(interception => {
        expect(interception.request.body).to.deep.include({
          name: 'sw_sync_completed',
          value: 1,
        });
      });
    });

    it('should handle sync failures', () => {
      // Add offline action
      cy.window().then(win => {
        const action = {
          type: 'universe_update',
          data: { id: 1, name: 'Updated Universe' },
          timestamp: Date.now(),
        };

        const dbRequest = win.indexedDB.open('harmonic-universe-db', 1);
        dbRequest.onsuccess = event => {
          const db = event.target.result;
          const tx = db.transaction('offlineActions', 'readwrite');
          const store = tx.objectStore('offlineActions');
          store.add(action);
        };
      });

      // Mock sync failure
      cy.intercept('POST', '/api/universes/1', {
        statusCode: 500,
        body: { error: 'Server error' },
      }).as('syncFailure');

      // Go online
      cy.window().then(win => {
        win.dispatchEvent(new Event('online'));
      });

      // Verify action remains in queue
      cy.window().then(win => {
        const dbRequest = win.indexedDB.open('harmonic-universe-db', 1);
        dbRequest.onsuccess = event => {
          const db = event.target.result;
          const tx = db.transaction('offlineActions', 'readonly');
          const store = tx.objectStore('offlineActions');
          store.count().onsuccess = e => {
            expect(e.target.result).to.equal(1);
          };
        };
      });
    });

    it('should handle sync conflicts', () => {
      // Add offline action
      cy.window().then(win => {
        const action = {
          type: 'universe_update',
          data: { id: 1, name: 'Local Change', version: 1 },
          timestamp: Date.now(),
        };

        const dbRequest = win.indexedDB.open('harmonic-universe-db', 1);
        dbRequest.onsuccess = event => {
          const db = event.target.result;
          const tx = db.transaction('offlineActions', 'readwrite');
          const store = tx.objectStore('offlineActions');
          store.add(action);
        };
      });

      // Mock conflict response
      cy.intercept('POST', '/api/universes/1', {
        statusCode: 409,
        body: {
          error: 'Conflict',
          serverVersion: {
            name: 'Remote Change',
            version: 2,
          },
        },
      }).as('syncConflict');

      // Go online
      cy.window().then(win => {
        win.dispatchEvent(new Event('online'));
      });

      // Verify conflict resolution UI
      cy.get('[data-testid="sync-conflict-dialog"]').should('be.visible');
      cy.get('[data-testid="sync-conflict-local"]').should(
        'contain',
        'Local Change'
      );
      cy.get('[data-testid="sync-conflict-remote"]').should(
        'contain',
        'Remote Change'
      );
    });
  });
});
