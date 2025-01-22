describe('Performance Monitoring', () => {
  beforeEach(() => {
    // Mock authentication
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        user: { id: 1, username: 'testuser1' },
        token: 'fake-jwt-token-1',
      },
    }).as('loginRequest');

    // Mock monitoring configuration
    cy.intercept('GET', '/api/monitoring/config', {
      statusCode: 200,
      body: {
        appVersion: '1.0.0',
        environment: 'test',
        analyticsEndpoint: '/api/analytics',
        sampling: {
          PERFORMANCE: 1.0, // 100% for testing
          ERROR: 1.0,
          ANALYTICS: 1.0,
        },
      },
    }).as('getMonitoringConfig');

    // Mock performance metrics endpoint
    cy.intercept('POST', '/api/analytics', {
      statusCode: 201,
      body: { message: 'Metrics recorded successfully' },
    }).as('recordMetrics');

    // Login and initialize monitoring
    cy.visit('/login');
    cy.get('input[type="email"]').type('user1@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.wait('@loginRequest');
  });

  describe('Core Web Vitals', () => {
    it('should track Largest Contentful Paint (LCP)', () => {
      cy.window().then(win => {
        // Simulate LCP metric
        const metric = {
          name: 'LCP',
          value: 2000,
          rating: 'good',
        };
        win.webVitals.getLCP(m => m(metric));
      });

      cy.wait('@recordMetrics').then(interception => {
        expect(interception.request.body).to.deep.include({
          name: 'performance_largest-contentful-paint',
          value: 2000,
          tags: {
            type: 'performance',
            rating: 'good',
          },
        });
      });
    });

    it('should track First Input Delay (FID)', () => {
      cy.window().then(win => {
        // Simulate FID metric
        const metric = {
          name: 'FID',
          value: 50,
          rating: 'good',
        };
        win.webVitals.getFID(m => m(metric));
      });

      cy.wait('@recordMetrics').then(interception => {
        expect(interception.request.body).to.deep.include({
          name: 'performance_first-input-delay',
          value: 50,
          tags: {
            type: 'performance',
            rating: 'good',
          },
        });
      });
    });

    it('should track Cumulative Layout Shift (CLS)', () => {
      cy.window().then(win => {
        // Simulate CLS metric
        const metric = {
          name: 'CLS',
          value: 0.05,
          rating: 'good',
        };
        win.webVitals.getCLS(m => m(metric));
      });

      cy.wait('@recordMetrics').then(interception => {
        expect(interception.request.body).to.deep.include({
          name: 'performance_cumulative-layout-shift',
          value: 0.05,
          tags: {
            type: 'performance',
            rating: 'good',
          },
        });
      });
    });
  });

  describe('Custom Performance Metrics', () => {
    it('should track audio processing time', () => {
      // Simulate audio processing
      cy.window().then(win => {
        win.monitoring.trackPerformance('audio_process_time', 150, {
          operation: 'harmony_generation',
          complexity: 'high',
        });
      });

      cy.wait('@recordMetrics').then(interception => {
        expect(interception.request.body).to.deep.include({
          name: 'audio_process_time',
          value: 150,
          tags: {
            type: 'performance',
            operation: 'harmony_generation',
            complexity: 'high',
          },
        });
      });
    });

    it('should track universe state updates', () => {
      // Simulate universe state update
      cy.window().then(win => {
        win.monitoring.trackPerformance('universe_state_update', 50, {
          operation: 'parameter_change',
          parameter_count: 5,
        });
      });

      cy.wait('@recordMetrics').then(interception => {
        expect(interception.request.body).to.deep.include({
          name: 'universe_state_update',
          value: 50,
          tags: {
            type: 'performance',
            operation: 'parameter_change',
            parameter_count: 5,
          },
        });
      });
    });
  });

  describe('Resource Monitoring', () => {
    it('should track memory usage', () => {
      cy.window().then(win => {
        // Simulate memory usage tracking
        if ('performance' in win && 'memory' in win.performance) {
          const memory = {
            usedJSHeapSize: 50000000,
            totalJSHeapSize: 100000000,
          };
          win.monitoring.trackPerformance(
            'memory_usage',
            memory.usedJSHeapSize,
            {
              total: memory.totalJSHeapSize,
              type: 'heap',
            }
          );
        }
      });

      cy.wait('@recordMetrics').then(interception => {
        expect(interception.request.body.name).to.equal('memory_usage');
        expect(interception.request.body.tags.type).to.equal('heap');
      });
    });

    it('should track long tasks', () => {
      cy.window().then(win => {
        // Simulate long task observer
        const observer = new win.PerformanceObserver(list => {
          list.getEntries().forEach(entry => {
            win.monitoring.trackPerformance('long_task', entry.duration, {
              type: 'task',
              location: entry.name,
            });
          });
        });
        observer.observe({ entryTypes: ['longtask'] });

        // Simulate a long task
        const task = {
          name: 'self',
          duration: 100,
          startTime: performance.now(),
        };
        observer.takeRecords()[0] = task;
      });

      cy.wait('@recordMetrics').then(interception => {
        expect(interception.request.body.name).to.equal('long_task');
        expect(interception.request.body.tags.type).to.equal('task');
      });
    });
  });

  describe('Error Tracking', () => {
    it('should track unhandled errors', () => {
      cy.window().then(win => {
        // Simulate unhandled error
        const error = new Error('Test error');
        win.monitoring._handleError({
          error,
          message: error.message,
          filename: 'test.js',
          lineno: 1,
          colno: 1,
        });
      });

      cy.wait('@recordMetrics').then(interception => {
        expect(interception.request.body).to.deep.include({
          name: 'error',
          value: 1,
          tags: {
            type: 'error',
            error_type: 'uncaught_error',
          },
        });
      });
    });

    it('should track unhandled promise rejections', () => {
      cy.window().then(win => {
        // Simulate unhandled promise rejection
        win.monitoring._handlePromiseError({
          reason: new Error('Promise rejection'),
        });
      });

      cy.wait('@recordMetrics').then(interception => {
        expect(interception.request.body).to.deep.include({
          name: 'error',
          value: 1,
          tags: {
            type: 'error',
            error_type: 'unhandled_rejection',
          },
        });
      });
    });
  });

  describe('Network Monitoring', () => {
    it('should track offline duration', () => {
      cy.window().then(win => {
        // Simulate going offline
        win.dispatchEvent(new Event('offline'));

        // Wait and simulate coming back online
        cy.wait(1000).then(() => {
          win.dispatchEvent(new Event('online'));
        });
      });

      cy.wait('@recordMetrics').then(interception => {
        expect(interception.request.body.name).to.equal('offline_duration');
        expect(interception.request.body.value).to.be.at.least(1000);
      });
    });

    it('should handle failed metric uploads', () => {
      // Simulate network failure
      cy.intercept('POST', '/api/analytics', {
        statusCode: 503,
        body: { error: 'Service unavailable' },
      }).as('failedMetrics');

      cy.window().then(win => {
        win.monitoring.trackPerformance('test_metric', 100);
      });

      // Verify metric is stored for retry
      cy.window().then(win => {
        expect(win.monitoring.failedMetrics.size).to.be.at.least(1);
      });

      // Restore network and verify retry
      cy.intercept('POST', '/api/analytics', {
        statusCode: 201,
        body: { message: 'Metrics recorded successfully' },
      }).as('retriedMetrics');

      cy.window().then(win => {
        win.monitoring.retryFailedMetrics();
      });

      cy.wait('@retriedMetrics').then(interception => {
        expect(interception.request.body.name).to.equal('test_metric');
      });
    });
  });
});
