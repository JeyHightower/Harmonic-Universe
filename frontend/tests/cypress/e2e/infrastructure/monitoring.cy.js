describe('System Monitoring', () => {
  beforeEach(() => {
    // Login as admin
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        user: { id: 1, username: 'admin', role: 'admin' },
        token: 'fake-jwt-token',
      },
    }).as('loginRequest');

    // Mock monitoring data
    cy.intercept('GET', '/api/monitoring/overview', {
      statusCode: 200,
      body: {
        system_health: {
          status: 'healthy',
          uptime: '99.99%',
          last_incident: null,
          active_users: 150,
          cpu_usage: 45,
          memory_usage: 60,
          disk_usage: 55,
        },
        performance_metrics: {
          response_time: 120,
          error_rate: 0.5,
          request_rate: 1000,
          concurrent_users: 50,
        },
        error_tracking: {
          total_errors: 25,
          unique_errors: 8,
          resolved_errors: 20,
          critical_errors: 2,
        },
      },
    }).as('getMonitoring');

    // Mock alerts
    cy.intercept('GET', '/api/monitoring/alerts', {
      statusCode: 200,
      body: {
        alerts: [
          {
            id: 1,
            type: 'high_cpu',
            severity: 'warning',
            message: 'CPU usage above 80%',
            timestamp: new Date().toISOString(),
            status: 'active',
          },
          {
            id: 2,
            type: 'error_spike',
            severity: 'critical',
            message: 'Error rate increased by 200%',
            timestamp: new Date().toISOString(),
            status: 'resolved',
          },
        ],
      },
    }).as('getAlerts');

    // Mock logs
    cy.intercept('GET', '/api/monitoring/logs', {
      statusCode: 200,
      body: {
        logs: [
          {
            id: 1,
            level: 'error',
            message: 'Database connection failed',
            timestamp: new Date().toISOString(),
            service: 'database',
            trace_id: 'trace-123',
          },
          {
            id: 2,
            level: 'info',
            message: 'User authentication successful',
            timestamp: new Date().toISOString(),
            service: 'auth',
            trace_id: 'trace-124',
          },
        ],
      },
    }).as('getLogs');

    // Login and navigate
    cy.visit('/login');
    cy.get('input[type="email"]').type('admin@example.com');
    cy.get('input[type="password"]').type('admin123');
    cy.get('button[type="submit"]').click();
    cy.wait('@loginRequest');

    cy.visit('/monitoring');
    cy.wait(['@getMonitoring', '@getAlerts', '@getLogs']);
  });

  it('should display system health overview', () => {
    cy.get('[data-testid="health-overview"]').should('be.visible');

    // Check status indicators
    cy.get('[data-testid="system-status"]')
      .should('contain', 'Healthy')
      .and('have.class', 'status-healthy');
    cy.get('[data-testid="uptime"]').should('contain', '99.99%');

    // Check resource usage
    cy.get('[data-testid="cpu-usage"]').within(() => {
      cy.get('.usage-value').should('contain', '45%');
      cy.get('.usage-graph').should('exist');
    });

    cy.get('[data-testid="memory-usage"]').within(() => {
      cy.get('.usage-value').should('contain', '60%');
      cy.get('.usage-graph').should('exist');
    });

    cy.get('[data-testid="disk-usage"]').within(() => {
      cy.get('.usage-value').should('contain', '55%');
      cy.get('.usage-graph').should('exist');
    });
  });

  it('should handle performance monitoring', () => {
    cy.get('[data-testid="performance-metrics"]').should('be.visible');

    // Check response time
    cy.get('[data-testid="response-time"]').within(() => {
      cy.get('.metric-value').should('contain', '120ms');
      cy.get('.trend-graph').should('exist');
    });

    // Check error rate
    cy.get('[data-testid="error-rate"]').within(() => {
      cy.get('.metric-value').should('contain', '0.5%');
      cy.get('.trend-graph').should('exist');
    });

    // Check request rate
    cy.get('[data-testid="request-rate"]').within(() => {
      cy.get('.metric-value').should('contain', '1000');
      cy.get('.trend-graph').should('exist');
    });

    // Test time range selection
    cy.get('[data-testid="time-range"]').select('1h');
    cy.get('[data-testid="refresh-metrics"]').click();
    cy.wait('@getMonitoring');
  });

  it('should handle error tracking', () => {
    cy.get('[data-testid="error-tracking"]').should('be.visible');

    // Check error statistics
    cy.get('[data-testid="total-errors"]').should('contain', '25');
    cy.get('[data-testid="unique-errors"]').should('contain', '8');
    cy.get('[data-testid="resolved-errors"]').should('contain', '20');
    cy.get('[data-testid="critical-errors"]').should('contain', '2');

    // Test error filtering
    cy.get('[data-testid="error-filter"]').select('critical');
    cy.get('[data-testid="error-list"]').should(
      'contain',
      'Error rate increased'
    );

    // Test error resolution
    cy.get('[data-testid="error-1"]')
      .find('[data-testid="resolve-error"]')
      .click();
    cy.get('[data-testid="resolution-notes"]').type('Fixed in latest deploy');
    cy.get('[data-testid="confirm-resolution"]').click();
  });

  it('should handle alert management', () => {
    cy.get('[data-testid="alert-management"]').should('be.visible');

    // Check alert list
    cy.get('[data-testid="alert-list"]').within(() => {
      cy.get('[data-testid="alert-1"]')
        .should('contain', 'CPU usage above 80%')
        .and('have.class', 'warning');
      cy.get('[data-testid="alert-2"]')
        .should('contain', 'Error rate increased')
        .and('have.class', 'critical');
    });

    // Test alert filtering
    cy.get('[data-testid="alert-filter"]').select('critical');
    cy.get('[data-testid="alert-list"]').should('have.length', 1);

    // Test alert acknowledgment
    cy.get('[data-testid="alert-1"]')
      .find('[data-testid="acknowledge-alert"]')
      .click();
    cy.get('[data-testid="ack-notes"]').type('Investigating high CPU usage');
    cy.get('[data-testid="confirm-ack"]').click();
  });

  it('should handle log analysis', () => {
    cy.get('[data-testid="log-analysis"]').should('be.visible');

    // Check log entries
    cy.get('[data-testid="log-list"]').within(() => {
      cy.get('[data-testid="log-1"]')
        .should('contain', 'Database connection failed')
        .and('have.class', 'error');
      cy.get('[data-testid="log-2"]')
        .should('contain', 'User authentication successful')
        .and('have.class', 'info');
    });

    // Test log filtering
    cy.get('[data-testid="log-level-filter"]').select('error');
    cy.get('[data-testid="service-filter"]').select('database');
    cy.get('[data-testid="log-list"]').should('have.length', 1);

    // Test log search
    cy.get('[data-testid="log-search"]').type('connection');
    cy.get('[data-testid="log-list"]').should('contain', 'connection failed');
  });

  it('should handle metric visualization', () => {
    // Test graph types
    cy.get('[data-testid="visualization-type"]').select('line');
    cy.get('[data-testid="metric-graph"]').should('have.class', 'line-graph');

    cy.get('[data-testid="visualization-type"]').select('bar');
    cy.get('[data-testid="metric-graph"]').should('have.class', 'bar-graph');

    // Test data aggregation
    cy.get('[data-testid="aggregation-period"]').select('1h');
    cy.get('[data-testid="refresh-graph"]').click();
    cy.wait('@getMonitoring');

    // Test metric comparison
    cy.get('[data-testid="compare-metrics"]').click();
    cy.get('[data-testid="metric-selector"]').select(['cpu', 'memory']);
    cy.get('[data-testid="comparison-graph"]').should('be.visible');
  });

  it('should handle report generation', () => {
    // Configure report
    cy.get('[data-testid="create-report"]').click();
    cy.get('[data-testid="report-type"]').select('performance');
    cy.get('[data-testid="report-period"]').select('last-7-days');
    cy.get('[data-testid="include-metrics"]').select([
      'cpu',
      'memory',
      'errors',
    ]);

    // Generate report
    cy.get('[data-testid="generate-report"]').click();
    cy.get('[data-testid="report-progress"]').should('be.visible');

    // Download report
    cy.get('[data-testid="download-report"]')
      .should('have.attr', 'href')
      .and('include', '/reports/');
  });

  it('should handle system configuration', () => {
    // Test alert thresholds
    cy.get('[data-testid="config-tab"]').click();
    cy.get('[data-testid="cpu-threshold"]').clear().type('90');
    cy.get('[data-testid="memory-threshold"]').clear().type('85');
    cy.get('[data-testid="error-threshold"]').clear().type('1.0');
    cy.get('[data-testid="save-thresholds"]').click();

    // Test notification settings
    cy.get('[data-testid="notification-email"]').type('alerts@example.com');
    cy.get('[data-testid="notification-slack"]').type('#monitoring');
    cy.get('[data-testid="save-notifications"]').click();

    // Test retention settings
    cy.get('[data-testid="log-retention"]').select('30d');
    cy.get('[data-testid="metric-retention"]').select('90d');
    cy.get('[data-testid="save-retention"]').click();
  });

  it('should handle incident management', () => {
    // Create incident
    cy.get('[data-testid="create-incident"]').click();
    cy.get('[data-testid="incident-title"]').type('Database Outage');
    cy.get('[data-testid="incident-severity"]').select('critical');
    cy.get('[data-testid="incident-description"]').type(
      'Complete database outage affecting all services'
    );
    cy.get('[data-testid="create-incident-submit"]').click();

    // Update incident
    cy.get('[data-testid="incident-1"]')
      .find('[data-testid="update-incident"]')
      .click();
    cy.get('[data-testid="incident-status"]').select('investigating');
    cy.get('[data-testid="incident-update"]').type('Investigation in progress');
    cy.get('[data-testid="submit-update"]').click();

    // Resolve incident
    cy.get('[data-testid="incident-1"]')
      .find('[data-testid="resolve-incident"]')
      .click();
    cy.get('[data-testid="resolution-details"]').type(
      'Database restored and stable'
    );
    cy.get('[data-testid="confirm-resolution"]').click();
  });

  it('should handle error states', () => {
    // Test data fetch error
    cy.intercept('GET', '/api/monitoring/overview', {
      statusCode: 500,
      body: {
        error: 'Internal server error',
      },
    }).as('getMonitoringError');

    cy.get('[data-testid="refresh-dashboard"]').click();
    cy.get('[data-testid="error-message"]')
      .should('be.visible')
      .and('contain', 'Failed to fetch monitoring data');

    // Test alert creation error
    cy.get('[data-testid="create-alert"]').click();
    cy.get('[data-testid="alert-name"]').type('Test Alert');
    cy.get('[data-testid="create-alert-submit"]').click();

    cy.get('[data-testid="alert-error"]')
      .should('be.visible')
      .and('contain', 'Failed to create alert');

    // Test report generation error
    cy.get('[data-testid="create-report"]').click();
    cy.get('[data-testid="generate-report"]').click();

    cy.get('[data-testid="report-error"]')
      .should('be.visible')
      .and('contain', 'Failed to generate report');
  });
});

describe('Infrastructure and Monitoring', () => {
  describe('Application Health', () => {
    it('should check API health endpoint', () => {
      cy.request('/api/health').then(response => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('status', 'healthy');
        expect(response.body).to.have.property('uptime').and.be.a('number');
      });
    });

    it('should verify API version', () => {
      cy.request('/api/version').then(response => {
        expect(response.status).to.eq(200);
        expect(response.body)
          .to.have.property('version')
          .and.match(/^\d+\.\d+\.\d+$/);
        expect(response.body).to.have.property('environment');
      });
    });
  });

  describe('Error Tracking', () => {
    beforeEach(() => {
      cy.intercept('POST', '/api/errors', {
        statusCode: 200,
        body: {
          success: true,
          errorId: 'test-error-id',
        },
      }).as('errorReport');
    });

    it('should report JavaScript errors', () => {
      cy.visit('/error-test', {
        onBeforeLoad(win) {
          cy.stub(win.console, 'error').as('consoleError');
        },
      });

      // Trigger a JavaScript error
      cy.window().then(win => {
        win.dispatchEvent(
          new ErrorEvent('error', {
            error: new Error('Test error'),
            message: 'Test error message',
          })
        );
      });

      // Verify error was reported
      cy.wait('@errorReport').then(interception => {
        expect(interception.request.body).to.have.property(
          'type',
          'javascript'
        );
        expect(interception.request.body)
          .to.have.property('message')
          .and.include('Test error');
      });

      // Verify console error was logged
      cy.get('@consoleError').should('have.been.called');
    });

    it('should report API errors', () => {
      cy.intercept('GET', '/api/data', {
        statusCode: 500,
        body: {
          error: 'Internal server error',
        },
      }).as('apiError');

      cy.visit('/data-page');
      cy.wait('@apiError');
      cy.wait('@errorReport').then(interception => {
        expect(interception.request.body).to.have.property('type', 'api');
        expect(interception.request.body).to.have.property('status', 500);
      });
    });
  });

  describe('Performance Monitoring', () => {
    beforeEach(() => {
      cy.intercept('POST', '/api/metrics', {
        statusCode: 200,
        body: {
          success: true,
        },
      }).as('metricsReport');
    });

    it('should track page load metrics', () => {
      cy.visit('/', {
        onBeforeLoad(win) {
          // Stub performance API
          cy.stub(win.performance, 'getEntriesByType').returns([
            {
              entryType: 'navigation',
              duration: 1000,
              domComplete: 800,
              loadEventEnd: 1000,
            },
          ]);
        },
      });

      cy.wait('@metricsReport').then(interception => {
        const metrics = interception.request.body;
        expect(metrics).to.have.property('pageLoad');
        expect(metrics.pageLoad)
          .to.have.property('duration')
          .and.be.a('number');
        expect(metrics.pageLoad)
          .to.have.property('domComplete')
          .and.be.a('number');
      });
    });

    it('should track API response times', () => {
      cy.intercept('GET', '/api/data', req => {
        req.reply({
          statusCode: 200,
          body: { data: 'test' },
          delay: 100,
        });
      }).as('slowRequest');

      cy.visit('/data-page');
      cy.wait('@slowRequest');
      cy.wait('@metricsReport').then(interception => {
        const metrics = interception.request.body;
        expect(metrics).to.have.property('apiLatency');
        expect(metrics.apiLatency).to.have.property('endpoint', '/api/data');
        expect(metrics.apiLatency)
          .to.have.property('duration')
          .and.be.above(90);
      });
    });
  });

  describe('Resource Loading', () => {
    it('should load and cache static assets', () => {
      cy.intercept('GET', '/static/**', {
        statusCode: 200,
      }).as('staticAsset');

      cy.visit('/');

      // Check if assets are cached
      cy.window().then(win => {
        return win.caches.open('static-assets').then(cache => {
          return cache.keys().then(keys => {
            expect(keys.length).to.be.above(0);
          });
        });
      });
    });

    it('should handle missing assets gracefully', () => {
      cy.intercept('GET', '/static/missing-image.jpg', {
        statusCode: 404,
      }).as('missingAsset');

      cy.visit('/');

      // Verify fallback content is shown
      cy.get('[data-testid="image-fallback"]').should('be.visible');
    });
  });

  describe('WebSocket Connection', () => {
    it('should establish and maintain WebSocket connection', () => {
      cy.visit('/', {
        onBeforeLoad(win) {
          cy.stub(win.console, 'log').as('consoleLog');
        },
      });

      // Verify WebSocket connection
      cy.window().then(win => {
        expect(win.WebSocket).to.be.a('function');
        const ws = new win.WebSocket('ws://localhost:5001/ws');

        ws.onopen = () => {
          expect(ws.readyState).to.equal(1); // OPEN
        };
      });
    });

    it('should handle WebSocket reconnection', () => {
      cy.visit('/', {
        onBeforeLoad(win) {
          cy.stub(win.console, 'log').as('consoleLog');
        },
      });

      cy.window().then(win => {
        const ws = new win.WebSocket('ws://localhost:5001/ws');

        // Force close connection
        ws.close();

        // Verify reconnection attempt
        cy.get('@consoleLog').should(
          'be.calledWith',
          'WebSocket: Attempting reconnection'
        );
      });
    });
  });

  describe('Browser Storage', () => {
    it('should handle localStorage quota exceeded', () => {
      cy.visit('/', {
        onBeforeLoad(win) {
          cy.stub(win.console, 'error').as('consoleError');

          // Mock localStorage to throw quota exceeded error
          win.localStorage.setItem = function () {
            throw new Error('QuotaExceededError');
          };
        },
      });

      // Attempt to store large data
      cy.window().then(win => {
        try {
          win.localStorage.setItem('test', 'x'.repeat(10000000));
        } catch (e) {
          expect(e.message).to.include('QuotaExceeded');
        }
      });

      // Verify error handling
      cy.get('[data-testid="storage-error"]')
        .should('be.visible')
        .and('contain', 'Storage quota exceeded');
    });

    it('should clean up old cache entries', () => {
      cy.visit('/', {
        onBeforeLoad(win) {
          // Add old cache entries
          win.caches.open('test-cache').then(cache => {
            cache.put('/old-data', new Response('old data'));
          });
        },
      });

      // Verify cache cleanup
      cy.window().then(win => {
        return win.caches.open('test-cache').then(cache => {
          return cache.keys().then(keys => {
            expect(keys.length).to.equal(0);
          });
        });
      });
    });
  });
});
