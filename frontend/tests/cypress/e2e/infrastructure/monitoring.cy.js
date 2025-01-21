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
