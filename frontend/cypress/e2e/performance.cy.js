describe('Performance Tests', () => {
  beforeEach(() => {
    cy.login('test@example.com', 'password123');
  });

  it('should load dashboard within performance budget', () => {
    cy.measurePageLoad('/dashboard').then(loadTime => {
      expect(loadTime).to.be.lessThan(3000); // 3 seconds budget
    });

    // Check for key metrics
    cy.window().then(win => {
      const performance = win.performance;
      const navigationTiming = performance.getEntriesByType('navigation')[0];
      const paintTiming = performance.getEntriesByType('paint');

      // Time to First Byte should be under 200ms
      expect(
        navigationTiming.responseStart - navigationTiming.requestStart
      ).to.be.lessThan(200);

      // First Contentful Paint should be under 1.5s
      const fcp = paintTiming.find(
        entry => entry.name === 'first-contentful-paint'
      );
      expect(fcp.startTime).to.be.lessThan(1500);
    });
  });

  it('should load universe list with efficient pagination', () => {
    cy.visit('/universes');
    cy.window().then(win => {
      const startTime = performance.now();
      cy.get('.universe-card')
        .should('exist')
        .then(() => {
          const loadTime = performance.now() - startTime;
          expect(loadTime).to.be.lessThan(1000); // 1 second budget for initial load
        });
    });

    // Test pagination performance
    cy.get('.pagination-next').click();
    cy.window().then(win => {
      const startTime = performance.now();
      cy.get('.universe-card')
        .should('exist')
        .then(() => {
          const loadTime = performance.now() - startTime;
          expect(loadTime).to.be.lessThan(500); // 500ms budget for pagination
        });
    });
  });

  it('should handle WebSocket messages efficiently', () => {
    cy.visit('/universes');
    cy.mockWebSocket();

    const messages = Array(100)
      .fill()
      .map((_, i) => ({
        type: 'update',
        data: {
          id: i,
          name: `Test Universe ${i}`,
          description: `Description ${i}`,
        },
      }));

    cy.window().then(win => {
      const startTime = performance.now();
      messages.forEach(msg => {
        win.dispatchEvent(new CustomEvent('universe-update', { detail: msg }));
      });

      // Wait for all updates to be processed
      cy.get('.universe-card')
        .should('have.length.at.least', 10)
        .then(() => {
          const processTime = performance.now() - startTime;
          expect(processTime).to.be.lessThan(1000); // 1 second budget for 100 messages
        });
    });
  });

  it('should load and render images efficiently', () => {
    cy.visit('/universes');

    cy.window().then(win => {
      const imageLoadTimes = [];
      const observer = new win.PerformanceObserver(list => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.initiatorType === 'img') {
            imageLoadTimes.push(entry.duration);
          }
        });
      });

      observer.observe({ entryTypes: ['resource'] });

      cy.get('img')
        .should('exist')
        .then(() => {
          const averageLoadTime =
            imageLoadTimes.reduce((a, b) => a + b, 0) / imageLoadTimes.length;
          expect(averageLoadTime).to.be.lessThan(500); // 500ms average budget per image
        });
    });
  });

  it('should maintain responsive UI during heavy operations', () => {
    cy.visit('/universes');

    // Create multiple universes rapidly
    const startTime = performance.now();
    for (let i = 0; i < 10; i++) {
      cy.createUniverse(`Performance Test ${i}`, `Description ${i}`, true);
    }

    // Measure UI responsiveness during creation
    cy.window().then(win => {
      const longTasks = win.performance.getEntriesByType('longtask');
      expect(longTasks.length).to.equal(0); // No long tasks blocking the main thread

      const processingTime = performance.now() - startTime;
      expect(processingTime).to.be.lessThan(5000); // 5 seconds budget for bulk operation
    });

    // Verify UI is still responsive
    cy.get('.search-input').type('Test').should('have.value', 'Test');
    cy.get('.universe-card').should('exist');
  });

  it('should handle memory usage efficiently', () => {
    cy.visit('/universes');

    cy.window().then(win => {
      const initialMemory = win.performance.memory?.usedJSHeapSize || 0;

      // Perform memory-intensive operations
      for (let i = 0; i < 100; i++) {
        cy.get('.universe-card').should('exist');
        cy.reload();
      }

      const finalMemory = win.performance.memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be less than 50MB
      expect(memoryIncrease).to.be.lessThan(50 * 1024 * 1024);
    });
  });
});
