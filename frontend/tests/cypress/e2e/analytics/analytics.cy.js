describe('Analytics Features', () => {
  beforeEach(() => {
    // Mock login
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        user: { id: 1, username: 'testuser', role: 'admin' },
        token: 'fake-jwt-token',
      },
    }).as('loginRequest');

    // Mock analytics overview data
    cy.intercept('GET', '/api/analytics/overview', {
      statusCode: 200,
      body: {
        total_users: 1000,
        active_users: 750,
        total_universes: 2500,
        total_collaborations: 1200,
        user_growth: [
          { date: '2024-01-01', value: 900 },
          { date: '2024-01-15', value: 1000 },
        ],
        universe_growth: [
          { date: '2024-01-01', value: 2200 },
          { date: '2024-01-15', value: 2500 },
        ],
      },
    }).as('getAnalyticsOverview');

    // Mock user activity data
    cy.intercept('GET', '/api/analytics/user-activity', {
      statusCode: 200,
      body: {
        daily_active: 750,
        weekly_active: 850,
        monthly_active: 950,
        average_session_duration: 1800,
        peak_usage_times: [
          { hour: 14, count: 500 },
          { hour: 15, count: 600 },
        ],
        user_actions: [
          { action: 'create_universe', count: 150 },
          { action: 'edit_universe', count: 300 },
          { action: 'share_universe', count: 100 },
        ],
      },
    }).as('getUserActivity');

    // Mock performance metrics
    cy.intercept('GET', '/api/analytics/performance', {
      statusCode: 200,
      body: {
        average_response_time: 150,
        error_rate: 0.02,
        cpu_utilization: 45,
        memory_usage: 60,
        database_queries: {
          total: 1000000,
          average_duration: 50,
          slow_queries: 25,
        },
        api_endpoints: [
          { path: '/api/universes', avg_response: 120, requests: 5000 },
          { path: '/api/collaboration', avg_response: 180, requests: 3000 },
        ],
      },
    }).as('getPerformanceMetrics');

    // Mock error tracking data
    cy.intercept('GET', '/api/analytics/errors', {
      statusCode: 200,
      body: {
        total_errors: 150,
        unique_errors: 25,
        error_types: [
          { type: 'ValidationError', count: 50 },
          { type: 'AuthenticationError', count: 30 },
          { type: 'DatabaseError', count: 20 },
        ],
        recent_errors: [
          {
            id: 'err-1',
            type: 'ValidationError',
            message: 'Invalid input',
            timestamp: '2024-01-15T10:00:00Z',
            count: 5,
          },
        ],
      },
    }).as('getErrorTracking');

    // Login and navigate
    cy.visit('/login');
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.wait('@loginRequest');

    cy.visit('/analytics');
    cy.wait([
      '@getAnalyticsOverview',
      '@getUserActivity',
      '@getPerformanceMetrics',
      '@getErrorTracking',
    ]);
  });

  it('should display analytics overview', () => {
    // Check key metrics
    cy.get('[data-testid="total-users"]').should('contain', '1,000');
    cy.get('[data-testid="active-users"]').should('contain', '750');
    cy.get('[data-testid="total-universes"]').should('contain', '2,500');
    cy.get('[data-testid="total-collaborations"]').should('contain', '1,200');

    // Check growth charts
    cy.get('[data-testid="user-growth-chart"]').should('be.visible');
    cy.get('[data-testid="universe-growth-chart"]').should('be.visible');

    // Test date range filter
    cy.get('[data-testid="date-range-picker"]').click();
    cy.get('[data-testid="last-30-days"]').click();
    cy.get('[data-testid="apply-date-range"]').click();
    cy.wait('@getAnalyticsOverview');
  });

  it('should track user activity', () => {
    cy.get('[data-testid="activity-tab"]').click();

    // Check activity metrics
    cy.get('[data-testid="daily-active"]').should('contain', '750');
    cy.get('[data-testid="weekly-active"]').should('contain', '850');
    cy.get('[data-testid="monthly-active"]').should('contain', '950');
    cy.get('[data-testid="avg-session"]').should('contain', '30 minutes');

    // Check usage patterns
    cy.get('[data-testid="peak-usage-chart"]').should('be.visible');
    cy.get('[data-testid="user-actions-chart"]').should('be.visible');

    // Test user segment filter
    cy.get('[data-testid="user-segment"]').select('premium');
    cy.wait('@getUserActivity');
  });

  it('should monitor performance metrics', () => {
    cy.get('[data-testid="performance-tab"]').click();

    // Check performance indicators
    cy.get('[data-testid="response-time"]').should('contain', '150ms');
    cy.get('[data-testid="error-rate"]').should('contain', '2%');
    cy.get('[data-testid="cpu-usage"]').should('contain', '45%');
    cy.get('[data-testid="memory-usage"]').should('contain', '60%');

    // Check database metrics
    cy.get('[data-testid="db-queries"]')
      .should('contain', '1,000,000')
      .and('contain', '50ms')
      .and('contain', '25 slow queries');

    // Check API performance
    cy.get('[data-testid="api-performance"]').within(() => {
      cy.contains('/api/universes')
        .should('contain', '120ms')
        .and('contain', '5,000 requests');
      cy.contains('/api/collaboration')
        .should('contain', '180ms')
        .and('contain', '3,000 requests');
    });

    // Test time period filter
    cy.get('[data-testid="time-period"]').select('last_hour');
    cy.wait('@getPerformanceMetrics');
  });

  it('should track errors', () => {
    cy.get('[data-testid="errors-tab"]').click();

    // Check error overview
    cy.get('[data-testid="total-errors"]').should('contain', '150');
    cy.get('[data-testid="unique-errors"]').should('contain', '25');

    // Check error distribution
    cy.get('[data-testid="error-types-chart"]').should('be.visible');

    // Check recent errors
    cy.get('[data-testid="recent-errors"]').within(() => {
      cy.contains('ValidationError')
        .should('contain', 'Invalid input')
        .and('contain', '5 occurrences');
    });

    // Test error filtering
    cy.get('[data-testid="error-type-filter"]').select('ValidationError');
    cy.wait('@getErrorTracking');
  });

  it('should handle custom dashboards', () => {
    cy.get('[data-testid="dashboards-tab"]').click();

    // Create custom dashboard
    cy.get('[data-testid="create-dashboard"]').click();
    cy.get('[data-testid="dashboard-name"]').type('Performance Overview');

    // Add widgets
    cy.get('[data-testid="add-widget"]').click();
    cy.get('[data-testid="widget-type"]').select('line_chart');
    cy.get('[data-testid="widget-metric"]').select('response_time');
    cy.get('[data-testid="widget-title"]').type('Response Time Trend');
    cy.get('[data-testid="save-widget"]').click();

    // Verify widget added
    cy.get('[data-testid="dashboard-widgets"]').should(
      'contain',
      'Response Time Trend'
    );

    // Save dashboard
    cy.get('[data-testid="save-dashboard"]').click();
    cy.get('[data-testid="dashboard-saved"]').should('be.visible');
  });

  it('should handle export functionality', () => {
    // Configure export
    cy.get('[data-testid="export-analytics"]').click();
    cy.get('[data-testid="export-type"]').select('performance');
    cy.get('[data-testid="date-range"]').click();
    cy.get('[data-testid="last-7-days"]').click();
    cy.get('[data-testid="export-format"]').select('csv');

    // Start export
    cy.get('[data-testid="start-export"]').click();
    cy.get('[data-testid="export-progress"]').should('be.visible');
    cy.get('[data-testid="export-complete"]').should('be.visible');
    cy.get('[data-testid="download-export"]').should('be.visible');
  });

  it('should handle real-time monitoring', () => {
    cy.get('[data-testid="real-time-tab"]').click();

    // Check real-time metrics
    cy.get('[data-testid="active-sessions"]').should('be.visible');
    cy.get('[data-testid="requests-per-second"]').should('be.visible');
    cy.get('[data-testid="error-rate-rt"]').should('be.visible');

    // Test auto-refresh
    cy.get('[data-testid="refresh-interval"]').select('10s');
    cy.get('[data-testid="auto-refresh-enabled"]').should('be.checked');
  });

  it('should handle alert system', () => {
    cy.get('[data-testid="alerts-tab"]').click();

    // Create alert rule
    cy.get('[data-testid="create-alert"]').click();
    cy.get('[data-testid="alert-metric"]').select('error_rate');
    cy.get('[data-testid="threshold"]').type('5');
    cy.get('[data-testid="duration"]').type('5');
    cy.get('[data-testid="notification-email"]').check();
    cy.get('[data-testid="save-alert"]').click();

    // Verify alert rule
    cy.get('[data-testid="alert-rules"]').should('contain', 'Error Rate > 5%');

    // Test alert history
    cy.get('[data-testid="alert-history"]').should('be.visible');
  });

  it('should handle trend analysis', () => {
    cy.get('[data-testid="trends-tab"]').click();

    // Configure trend analysis
    cy.get('[data-testid="trend-metric"]').select('user_growth');
    cy.get('[data-testid="trend-period"]').select('monthly');
    cy.get('[data-testid="analyze-trend"]').click();

    // Check trend results
    cy.get('[data-testid="trend-chart"]').should('be.visible');
    cy.get('[data-testid="trend-insights"]').should('be.visible');

    // Test comparison
    cy.get('[data-testid="compare-periods"]').click();
    cy.get('[data-testid="comparison-chart"]').should('be.visible');
  });

  it('should generate reports', () => {
    cy.get('[data-testid="reports-tab"]').click();

    // Create report
    cy.get('[data-testid="create-report"]').click();
    cy.get('[data-testid="report-name"]').type('Monthly Performance');
    cy.get('[data-testid="report-type"]').select('performance');
    cy.get('[data-testid="report-frequency"]').select('monthly');
    cy.get('[data-testid="report-format"]').select('pdf');

    // Configure recipients
    cy.get('[data-testid="add-recipient"]').click();
    cy.get('[data-testid="recipient-email"]').type('admin@example.com');

    // Save report
    cy.get('[data-testid="save-report"]').click();
    cy.get('[data-testid="report-saved"]').should('be.visible');

    // Generate report manually
    cy.get('[data-testid="generate-now"]').click();
    cy.get('[data-testid="report-generated"]').should('be.visible');
  });
});
