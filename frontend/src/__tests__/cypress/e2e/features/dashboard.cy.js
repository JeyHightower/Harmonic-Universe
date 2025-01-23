describe('Dashboard Features', () => {
  beforeEach(() => {
    // Login before each test
    cy.login();
    cy.visit('/dashboard');
  });

  describe('Dashboard Layout', () => {
    it('should display dashboard header', () => {
      cy.get('.dashboard-header')
        .should('be.visible')
        .within(() => {
          cy.contains('h1', 'Welcome to Your Universe').should('be.visible');
          cy.contains(
            'p',
            'Create, explore, and shape your musical universe'
          ).should('be.visible');
        });
    });

    it('should display all dashboard cards', () => {
      cy.get('.dashboard-grid').within(() => {
        // Create Universe card
        cy.get('.dashboard-card')
          .should('contain', 'Create Universe')
          .and('contain', 'Start a new musical journey');

        // Profile card
        cy.get('.dashboard-card')
          .should('contain', 'Your Profile')
          .and('contain', 'View and edit your profile');

        // Audio Controls card
        cy.get('.dashboard-card')
          .should('contain', 'Audio Controls')
          .and('contain', 'Manage your audio settings');

        // Statistics card
        cy.get('.dashboard-card')
          .should('contain', 'Statistics')
          .and('contain', 'View your creation stats');
      });
    });

    it('should display recent activity section', () => {
      cy.get('.recent-activity')
        .should('be.visible')
        .within(() => {
          cy.contains('h2', 'Recent Activity').should('be.visible');
          cy.get('.activity-list').should('be.visible');
        });
    });
  });

  describe('Dashboard Navigation', () => {
    it('should navigate to universe creation', () => {
      cy.contains('.dashboard-card', 'Create Universe').click();
      cy.url().should('include', '/universe/create');
    });

    it('should navigate to profile', () => {
      cy.contains('.dashboard-card', 'Your Profile').click();
      cy.url().should('include', '/profile');
    });

    it('should navigate to audio controls', () => {
      cy.contains('.dashboard-card', 'Audio Controls').click();
      cy.url().should('include', '/audio');
    });
  });

  describe('Recent Activity', () => {
    it('should display empty state when no activity', () => {
      cy.get('.activity-list')
        .should('be.visible')
        .within(() => {
          cy.get('.empty-state')
            .should('be.visible')
            .and('contain', 'No recent activity to show');
        });
    });

    it('should display recent activities when available', () => {
      // Mock recent activities
      cy.intercept('GET', '/api/user/activities', {
        statusCode: 200,
        body: [
          {
            id: 1,
            type: 'universe_created',
            description: 'Created new universe "Test Universe"',
            timestamp: new Date().toISOString(),
          },
          {
            id: 2,
            type: 'profile_updated',
            description: 'Updated profile information',
            timestamp: new Date().toISOString(),
          },
        ],
      }).as('getActivities');

      cy.visit('/dashboard');
      cy.wait('@getActivities');

      cy.get('.activity-list').within(() => {
        cy.contains('Created new universe "Test Universe"').should(
          'be.visible'
        );
        cy.contains('Updated profile information').should('be.visible');
      });
    });
  });

  describe('Dashboard Responsiveness', () => {
    it('should adapt layout for mobile viewport', () => {
      cy.viewport('iphone-x');

      // Check if grid becomes single column
      cy.get('.dashboard-grid')
        .should('have.css', 'grid-template-columns')
        .and('match', /1fr/);

      // Check if cards stack vertically
      cy.get('.dashboard-card')
        .first()
        .should('have.css', 'width')
        .and('match', /100%/);
    });

    it('should maintain readability on small screens', () => {
      cy.viewport('iphone-x');

      // Verify text remains readable
      cy.get('.dashboard-header h1')
        .should('be.visible')
        .and('have.css', 'font-size')
        .and('be.gt', '20px');

      cy.get('.dashboard-card h3')
        .should('be.visible')
        .and('have.css', 'font-size')
        .and('be.gt', '16px');
    });
  });

  describe('Dashboard State Management', () => {
    it('should persist user preferences', () => {
      // Mock user preferences
      cy.intercept('GET', '/api/user/preferences', {
        statusCode: 200,
        body: {
          theme: 'dark',
          cardLayout: 'compact',
        },
      }).as('getPreferences');

      cy.intercept('PUT', '/api/user/preferences', {
        statusCode: 200,
        body: {
          success: true,
        },
      }).as('updatePreferences');

      // Visit dashboard with preferences
      cy.visit('/dashboard');
      cy.wait('@getPreferences');

      // Verify theme application
      cy.get('.dashboard-container').should('have.class', 'theme-dark');

      // Verify layout preference
      cy.get('.dashboard-grid').should('have.class', 'layout-compact');
    });

    it('should handle preference update errors', () => {
      cy.intercept('PUT', '/api/user/preferences', {
        statusCode: 500,
        body: {
          error: 'Failed to update preferences',
        },
      }).as('preferencesError');

      // Attempt to update preferences
      cy.get('[data-testid="theme-toggle"]').click();
      cy.wait('@preferencesError');

      // Verify error message
      cy.get('[data-testid="preferences-error"]')
        .should('be.visible')
        .and('contain', 'Failed to update preferences');
    });
  });
});
