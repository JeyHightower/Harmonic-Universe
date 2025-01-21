describe('Analytics Features', () => {
  beforeEach(() => {
    // Mock authentication
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        user: { id: 1, username: 'testuser' },
        token: 'fake-jwt-token',
      },
    }).as('loginRequest');

    // Mock analytics data
    cy.intercept('GET', '/api/analytics/dashboard', {
      statusCode: 200,
      body: {
        userStats: {
          totalUniverses: 10,
          activeCollaborations: 5,
          totalViews: 1000,
          averageEngagement: 15.5,
        },
        recentActivity: [
          {
            id: 1,
            type: 'universe_created',
            timestamp: new Date().toISOString(),
            details: { universeName: 'New Universe' },
          },
        ],
        popularUniverses: [
          {
            id: 1,
            name: 'Popular Universe',
            views: 500,
            collaborators: 3,
          },
        ],
      },
    }).as('getAnalytics');

    // Login and visit analytics
    cy.visit('/login');
    cy.get('[data-testid="login-email"]').type('test@example.com');
    cy.get('[data-testid="login-password"]').type('password123');
    cy.get('[data-testid="login-submit"]').click();
    cy.wait('@loginRequest');

    cy.visit('/analytics');
    cy.wait('@getAnalytics');
  });

  describe('Dashboard Overview', () => {
    it('should display key metrics', () => {
      // Verify metric displays
      cy.get('[data-testid="total-universes"]').should('contain', '10');
      cy.get('[data-testid="active-collaborations"]').should('contain', '5');
      cy.get('[data-testid="total-views"]').should('contain', '1,000');
      cy.get('[data-testid="avg-engagement"]').should('contain', '15.5');
    });

    it('should show recent activity', () => {
      // Verify activity feed
      cy.get('[data-testid="activity-feed"]').within(() => {
        cy.get('[data-testid="activity-1"]')
          .should('contain', 'New Universe')
          .and('contain', 'created');
      });
    });

    it('should display popular universes', () => {
      // Verify popular content section
      cy.get('[data-testid="popular-universes"]').within(() => {
        cy.get('[data-testid="universe-1"]')
          .should('contain', 'Popular Universe')
          .and('contain', '500 views')
          .and('contain', '3 collaborators');
      });
    });
  });

  describe('Detailed Analytics', () => {
    it('should handle date range selection', () => {
      // Mock date-filtered data
      cy.intercept('GET', '/api/analytics/dashboard?start=*&end=*', {
        statusCode: 200,
        body: {
          userStats: {
            totalUniverses: 5,
            activeCollaborations: 2,
            totalViews: 500,
            averageEngagement: 10.0,
          },
        },
      }).as('getFilteredAnalytics');

      // Select date range
      cy.get('[data-testid="date-range-start"]').type('2024-01-01');
      cy.get('[data-testid="date-range-end"]').type('2024-01-31');
      cy.get('[data-testid="apply-date-filter"]').click();
      cy.wait('@getFilteredAnalytics');

      // Verify filtered data
      cy.get('[data-testid="total-universes"]').should('contain', '5');
    });

    it('should generate detailed reports', () => {
      // Mock report generation
      cy.intercept('POST', '/api/analytics/reports', {
        statusCode: 200,
        body: {
          reportUrl: 'https://example.com/report.pdf',
        },
      }).as('generateReport');

      // Configure and generate report
      cy.get('[data-testid="report-type"]').select('engagement');
      cy.get('[data-testid="include-charts"]').check();
      cy.get('[data-testid="generate-report"]').click();
      cy.wait('@generateReport');

      // Verify download link
      cy.get('[data-testid="report-download"]')
        .should('have.attr', 'href')
        .and('include', 'report.pdf');
    });
  });

  describe('Visualization Features', () => {
    it('should display engagement charts', () => {
      // Mock chart data
      cy.intercept('GET', '/api/analytics/charts/engagement', {
        statusCode: 200,
        body: {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          datasets: [
            {
              label: 'Views',
              data: [100, 150, 200, 250],
            },
            {
              label: 'Interactions',
              data: [50, 75, 100, 125],
            },
          ],
        },
      }).as('getChartData');

      // View engagement chart
      cy.get('[data-testid="view-engagement-chart"]').click();
      cy.wait('@getChartData');

      // Verify chart rendering
      cy.get('[data-testid="engagement-chart"]').should('be.visible');
      cy.get('[data-testid="chart-legend"]')
        .should('contain', 'Views')
        .and('contain', 'Interactions');
    });

    it('should handle chart interactions', () => {
      // Mock detailed data point
      cy.intercept('GET', '/api/analytics/datapoint/*', {
        statusCode: 200,
        body: {
          date: '2024-01-01',
          views: 100,
          uniqueVisitors: 75,
          averageTimeSpent: '5m 30s',
        },
      }).as('getDataPoint');

      // Interact with chart
      cy.get('[data-testid="chart-datapoint"]').first().click();
      cy.wait('@getDataPoint');

      // Verify tooltip/detail view
      cy.get('[data-testid="datapoint-details"]')
        .should('be.visible')
        .and('contain', '75 unique visitors')
        .and('contain', '5m 30s');
    });
  });

  describe('Export and Integration', () => {
    it('should export analytics data', () => {
      // Mock export request
      cy.intercept('POST', '/api/analytics/export', {
        statusCode: 200,
        body: {
          exportUrl: 'https://example.com/analytics.csv',
        },
      }).as('exportData');

      // Configure and start export
      cy.get('[data-testid="export-format"]').select('csv');
      cy.get('[data-testid="export-data"]').click();
      cy.wait('@exportData');

      // Verify export completion
      cy.get('[data-testid="export-success"]').should('be.visible');
      cy.get('[data-testid="download-export"]')
        .should('have.attr', 'href')
        .and('include', 'analytics.csv');
    });

    it('should integrate with external tools', () => {
      // Mock integration setup
      cy.intercept('POST', '/api/analytics/integrations/google', {
        statusCode: 200,
        body: {
          connected: true,
          status: 'active',
        },
      }).as('connectGoogle');

      // Configure integration
      cy.get('[data-testid="integration-google"]').click();
      cy.get('[data-testid="connect-google"]').click();
      cy.wait('@connectGoogle');

      // Verify connection
      cy.get('[data-testid="integration-status"]')
        .should('contain', 'Connected')
        .and('have.class', 'active');
    });
  });

  describe('Error Handling', () => {
    it('should handle data fetch errors', () => {
      // Mock error response
      cy.intercept('GET', '/api/analytics/dashboard', {
        statusCode: 500,
        body: {
          error: 'Analytics service unavailable',
        },
      }).as('analyticsError');

      // Reload analytics
      cy.get('[data-testid="refresh-analytics"]').click();
      cy.wait('@analyticsError');

      // Verify error handling
      cy.get('[data-testid="analytics-error"]')
        .should('be.visible')
        .and('contain', 'Analytics service unavailable');
    });

    it('should handle export errors', () => {
      // Mock export error
      cy.intercept('POST', '/api/analytics/export', {
        statusCode: 500,
        body: {
          error: 'Export failed',
        },
      }).as('exportError');

      // Attempt export
      cy.get('[data-testid="export-data"]').click();
      cy.wait('@exportError');

      // Verify error message
      cy.get('[data-testid="export-error"]')
        .should('be.visible')
        .and('contain', 'Export failed');
    });
  });
});
