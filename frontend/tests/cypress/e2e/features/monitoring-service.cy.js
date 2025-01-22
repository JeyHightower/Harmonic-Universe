describe('Monitoring Service', () => {
  beforeEach(() => {
    // Mock analytics endpoint
    cy.intercept('POST', '/api/analytics', {
      statusCode: 201,
      body: {
        message: 'Analytics recorded successfully',
        id: 'test-metric-id',
      },
    }).as('trackAnalytics');

    // Mock performance observer
    cy.window().then(win => {
      win.PerformanceObserver = class {
        constructor(callback) {
          this.callback = callback;
        }
        observe() {
          // Simulate performance entries
          this.callback({
            getEntries: () => [
              {
                name: 'first-paint',
                startTime: 1000,
                entryType: 'paint',
              },
              {
                name: 'first-contentful-paint',
                startTime: 1200,
                entryType: 'paint',
              },
            ],
          });
        }
        disconnect() {}
      };
    });

    // Mock web vitals
    cy.window().then(win => {
      win.webVitals = {
        getCLS: callback => callback({ value: 0.1 }),
        getFID: callback => callback({ value: 100 }),
        getLCP: callback => callback({ value: 2000 }),
      };
    });

    // Visit app with monitoring enabled
    cy.visit('/', {
      onBeforeLoad: win => {
        win.APP_CONFIG = {
          monitoring: {
            enabled: true,
            environment: 'test',
            appVersion: '1.0.0',
          },
        };
      },
    });
  });

  describe('Performance Tracking', () => {
    it('should track paint timing metrics', () => {
      // Verify paint metrics were tracked
      cy.wait('@trackAnalytics').then(interception => {
        const { name, value, tags } = interception.request.body;
        expect(name).to.equal('performance_first-paint');
        expect(value).to.equal(1000);
        expect(tags.type).to.equal('performance');
      });

      cy.wait('@trackAnalytics').then(interception => {
        const { name, value, tags } = interception.request.body;
        expect(name).to.equal('performance_first-contentful-paint');
        expect(value).to.equal(1200);
        expect(tags.type).to.equal('performance');
      });
    });

    it('should track web vitals', () => {
      // Verify CLS tracking
      cy.wait('@trackAnalytics').then(interception => {
        const { name, value, tags } = interception.request.body;
        expect(name).to.equal('performance_cumulative-layout-shift');
        expect(value).to.equal(0.1);
        expect(tags.type).to.equal('performance');
      });

      // Verify FID tracking
      cy.wait('@trackAnalytics').then(interception => {
        const { name, value, tags } = interception.request.body;
        expect(name).to.equal('performance_first-input-delay');
        expect(value).to.equal(100);
        expect(tags.type).to.equal('performance');
      });

      // Verify LCP tracking
      cy.wait('@trackAnalytics').then(interception => {
        const { name, value, tags } = interception.request.body;
        expect(name).to.equal('performance_largest-contentful-paint');
        expect(value).to.equal(2000);
        expect(tags.type).to.equal('performance');
      });
    });

    it('should track custom performance metrics', () => {
      // Trigger custom performance measurement
      cy.window().then(win => {
        win.monitoring.trackPerformance('custom_operation', 500, {
          operation: 'test-operation',
        });
      });

      // Verify custom metric was tracked
      cy.wait('@trackAnalytics').then(interception => {
        const { name, value, tags } = interception.request.body;
        expect(name).to.equal('custom_operation');
        expect(value).to.equal(500);
        expect(tags.type).to.equal('performance');
        expect(tags.operation).to.equal('test-operation');
      });
    });
  });

  describe('Error Tracking', () => {
    it('should track uncaught errors', () => {
      // Simulate uncaught error
      cy.window().then(win => {
        win.dispatchEvent(
          new ErrorEvent('error', {
            error: new Error('Test error'),
            message: 'Test error message',
          })
        );
      });

      // Verify error was tracked
      cy.wait('@trackAnalytics').then(interception => {
        const { name, value, tags } = interception.request.body;
        expect(name).to.equal('error_uncaught');
        expect(value).to.equal(1);
        expect(tags.type).to.equal('error');
        expect(tags.message).to.equal('Test error message');
      });
    });

    it('should track unhandled promise rejections', () => {
      // Simulate unhandled rejection
      cy.window().then(win => {
        win.dispatchEvent(new Event('unhandledrejection'));
      });

      // Verify rejection was tracked
      cy.wait('@trackAnalytics').then(interception => {
        const { name, value, tags } = interception.request.body;
        expect(name).to.equal('error_unhandled_rejection');
        expect(value).to.equal(1);
        expect(tags.type).to.equal('error');
      });
    });

    it('should track API errors', () => {
      // Simulate API error
      cy.window().then(win => {
        win.monitoring.trackError(new Error('API error'), {
          type: 'api',
          endpoint: '/test',
          status: 500,
        });
      });

      // Verify API error was tracked
      cy.wait('@trackAnalytics').then(interception => {
        const { name, value, tags } = interception.request.body;
        expect(name).to.equal('error_api');
        expect(value).to.equal(1);
        expect(tags.type).to.equal('error');
        expect(tags.endpoint).to.equal('/test');
        expect(tags.status).to.equal(500);
      });
    });
  });

  describe('User Action Tracking', () => {
    it('should track button clicks', () => {
      // Click a button
      cy.get('button').first().click();

      // Verify click was tracked
      cy.wait('@trackAnalytics').then(interception => {
        const { name, value, tags } = interception.request.body;
        expect(name).to.equal('session_interaction');
        expect(value).to.equal(1);
        expect(tags.type).to.equal('click');
        expect(tags.element).to.equal('button');
      });
    });

    it('should track navigation', () => {
      // Trigger navigation
      cy.visit('/about');

      // Verify navigation was tracked
      cy.wait('@trackAnalytics').then(interception => {
        const { name, value, tags } = interception.request.body;
        expect(name).to.equal('session_route_change');
        expect(value).to.equal(1);
        expect(tags.path).to.equal('/about');
      });
    });
  });

  describe('PWA Tracking', () => {
    it('should track install prompt', () => {
      // Simulate install prompt
      cy.window().then(win => {
        win.dispatchEvent(new Event('beforeinstallprompt'));
      });

      // Verify prompt was tracked
      cy.wait('@trackAnalytics').then(interception => {
        const { name, value, tags } = interception.request.body;
        expect(name).to.equal('pwa_install_prompt');
        expect(value).to.equal(1);
      });
    });

    it('should track offline usage', () => {
      // Simulate offline
      cy.window().then(win => {
        win.dispatchEvent(new Event('offline'));

        // Wait and simulate online
        setTimeout(() => {
          win.dispatchEvent(new Event('online'));
        }, 1000);
      });

      // Verify offline duration was tracked
      cy.wait('@trackAnalytics').then(interception => {
        const { name, tags } = interception.request.body;
        expect(name).to.equal('pwa_offline_usage');
        expect(tags.duration).to.be.greaterThan(0);
      });
    });
  });

  describe('Service Worker Tracking', () => {
    it('should track service worker registration', () => {
      // Mock service worker registration
      cy.window().then(win => {
        win.navigator.serviceWorker.dispatchEvent(
          new Event('controllerchange')
        );
      });

      // Verify registration was tracked
      cy.wait('@trackAnalytics').then(interception => {
        const { name, value, tags } = interception.request.body;
        expect(name).to.equal('sw_registration');
        expect(value).to.equal(1);
        expect(tags.state).to.equal('ready');
      });
    });

    it('should track cache updates', () => {
      // Simulate cache update message
      cy.window().then(win => {
        win.navigator.serviceWorker.dispatchEvent(
          new MessageEvent('message', {
            data: {
              type: 'CACHE_UPDATED',
              url: '/test.js',
            },
          })
        );
      });

      // Verify cache update was tracked
      cy.wait('@trackAnalytics').then(interception => {
        const { name, value, tags } = interception.request.body;
        expect(name).to.equal('sw_cache_updated');
        expect(value).to.equal(1);
        expect(tags.url).to.equal('/test.js');
      });
    });
  });

  describe('Retry Mechanism', () => {
    it('should retry failed metrics', () => {
      // Mock failed analytics request
      cy.intercept('POST', '/api/analytics', {
        statusCode: 500,
        times: 1,
      }).as('failedAnalytics');

      // Mock successful retry
      cy.intercept('POST', '/api/analytics', {
        statusCode: 201,
        body: {
          message: 'Analytics recorded successfully',
          id: 'retry-metric-id',
        },
      }).as('retryAnalytics');

      // Trigger metric
      cy.window().then(win => {
        win.monitoring.trackEvent('test_metric', 1);
      });

      // Verify initial failure
      cy.wait('@failedAnalytics');

      // Verify successful retry
      cy.wait('@retryAnalytics').then(interception => {
        const { name, value } = interception.request.body;
        expect(name).to.equal('test_metric');
        expect(value).to.equal(1);
      });
    });

    it('should handle retry limits', () => {
      // Mock consistently failed analytics requests
      cy.intercept('POST', '/api/analytics', {
        statusCode: 500,
        times: 5,
      }).as('failedAnalytics');

      // Trigger metric
      cy.window().then(win => {
        win.monitoring.trackEvent('test_metric', 1);
      });

      // Verify retries were attempted
      cy.get('@failedAnalytics.all').should('have.length', 5);
    });
  });
});
