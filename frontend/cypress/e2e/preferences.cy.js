describe('User Preferences', () => {
  beforeEach(() => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:5000/api/auth/login',
      body: {
        email: 'test@example.com',
        password: 'password123',
      },
    }).then(response => {
      localStorage.setItem('token', response.body.token);
    });

    cy.visit('/settings');
  });

  afterEach(() => {
    localStorage.removeItem('token');
  });

  describe('Theme Settings', () => {
    it('should change theme preference', () => {
      cy.intercept('GET', 'http://localhost:5000/api/preferences', {
        statusCode: 200,
        body: {
          theme: 'light',
          emailNotifications: true,
          pushNotifications: true,
          highContrast: false,
          fontSize: 16,
          dashboardLayout: 'grid',
          language: 'en',
          timezone: 'UTC',
        },
      }).as('getPreferences');

      cy.intercept('PUT', 'http://localhost:5000/api/preferences', {
        statusCode: 200,
        body: {
          theme: 'dark',
          emailNotifications: true,
          pushNotifications: true,
          highContrast: false,
          fontSize: 16,
          dashboardLayout: 'grid',
          language: 'en',
          timezone: 'UTC',
        },
      }).as('updatePreferences');

      cy.wait('@getPreferences');

      cy.get('[data-testid="theme-toggle"]').click();

      cy.get('[data-testid="save-preferences"]').click();

      cy.wait('@updatePreferences');

      cy.get('body').should('have.class', 'dark-theme');
    });

    it('should persist theme preference', () => {
      cy.intercept('GET', 'http://localhost:5000/api/preferences', {
        statusCode: 200,
        body: {
          theme: 'dark',
          emailNotifications: true,
          pushNotifications: true,
          highContrast: false,
          fontSize: 16,
          dashboardLayout: 'grid',
          language: 'en',
          timezone: 'UTC',
        },
      }).as('getPreferences');

      cy.wait('@getPreferences');

      cy.get('body').should('have.class', 'dark-theme');
    });
  });

  describe('Notification Settings', () => {
    it('should update notification preferences', () => {
      cy.intercept('GET', 'http://localhost:5000/api/preferences', {
        statusCode: 200,
        body: {
          theme: 'light',
          emailNotifications: true,
          pushNotifications: true,
          highContrast: false,
          fontSize: 16,
          dashboardLayout: 'grid',
          language: 'en',
          timezone: 'UTC',
        },
      }).as('getPreferences');

      cy.intercept('PUT', 'http://localhost:5000/api/preferences', {
        statusCode: 200,
        body: {
          theme: 'light',
          emailNotifications: false,
          pushNotifications: false,
          highContrast: false,
          fontSize: 16,
          dashboardLayout: 'grid',
          language: 'en',
          timezone: 'UTC',
        },
      }).as('updatePreferences');

      cy.wait('@getPreferences');

      cy.get('[data-testid="email-notifications-toggle"]').click();
      cy.get('[data-testid="push-notifications-toggle"]').click();

      cy.get('[data-testid="save-preferences"]').click();

      cy.wait('@updatePreferences');

      cy.get('[data-testid="email-notifications-toggle"]').should(
        'not.be.checked'
      );
      cy.get('[data-testid="push-notifications-toggle"]').should(
        'not.be.checked'
      );
    });
  });

  describe('Accessibility Settings', () => {
    it('should update accessibility preferences', () => {
      cy.intercept('GET', 'http://localhost:5000/api/preferences', {
        statusCode: 200,
        body: {
          theme: 'light',
          emailNotifications: true,
          pushNotifications: true,
          highContrast: false,
          fontSize: 16,
          dashboardLayout: 'grid',
          language: 'en',
          timezone: 'UTC',
        },
      }).as('getPreferences');

      cy.intercept('PUT', 'http://localhost:5000/api/preferences', {
        statusCode: 200,
        body: {
          theme: 'light',
          emailNotifications: true,
          pushNotifications: true,
          highContrast: true,
          fontSize: 20,
          dashboardLayout: 'grid',
          language: 'en',
          timezone: 'UTC',
        },
      }).as('updatePreferences');

      cy.wait('@getPreferences');

      cy.get('[data-testid="high-contrast-toggle"]').click();

      cy.get('[data-testid="font-size-slider"]')
        .invoke('val', 20)
        .trigger('change');

      cy.get('[data-testid="save-preferences"]').click();

      cy.wait('@updatePreferences');

      cy.get('[data-testid="high-contrast-toggle"]').should('be.checked');
      cy.get('[data-testid="font-size-slider"]').should('have.value', '20');
    });
  });

  describe('Dashboard Layout', () => {
    it('should customize dashboard layout', () => {
      cy.intercept('GET', 'http://localhost:5000/api/preferences', {
        statusCode: 200,
        body: {
          theme: 'light',
          emailNotifications: true,
          pushNotifications: true,
          highContrast: false,
          fontSize: 16,
          dashboardLayout: 'grid',
          language: 'en',
          timezone: 'UTC',
        },
      }).as('getPreferences');

      cy.intercept('PUT', 'http://localhost:5000/api/preferences', {
        statusCode: 200,
        body: {
          theme: 'light',
          emailNotifications: true,
          pushNotifications: true,
          highContrast: false,
          fontSize: 16,
          dashboardLayout: 'list',
          language: 'en',
          timezone: 'UTC',
        },
      }).as('updatePreferences');

      cy.wait('@getPreferences');

      cy.get('[data-testid="dashboard-layout-select"]').click();
      cy.get('[data-value="list"]').click();

      cy.get('[data-testid="save-preferences"]').click();

      cy.wait('@updatePreferences');

      cy.get('[data-testid="dashboard-layout-select"]').should(
        'have.value',
        'list'
      );
    });
  });

  describe('Localization', () => {
    it('should update language preference', () => {
      cy.intercept('GET', 'http://localhost:5000/api/preferences', {
        statusCode: 200,
        body: {
          theme: 'light',
          emailNotifications: true,
          pushNotifications: true,
          highContrast: false,
          fontSize: 16,
          dashboardLayout: 'grid',
          language: 'en',
          timezone: 'UTC',
        },
      }).as('getPreferences');

      cy.intercept('PUT', 'http://localhost:5000/api/preferences', {
        statusCode: 200,
        body: {
          theme: 'light',
          emailNotifications: true,
          pushNotifications: true,
          highContrast: false,
          fontSize: 16,
          dashboardLayout: 'grid',
          language: 'es',
          timezone: 'UTC',
        },
      }).as('updatePreferences');

      cy.wait('@getPreferences');

      cy.get('[data-testid="language-select"]').click();
      cy.get('[data-value="es"]').click();

      cy.get('[data-testid="save-preferences"]').click();

      cy.wait('@updatePreferences');

      cy.get('[data-testid="language-select"]').should('have.value', 'es');
    });

    it('should update timezone', () => {
      cy.get('[data-testid="timezone-select"]').select('America/New_York');
      cy.get('[data-testid="save-preferences"]').click();
      cy.get('[data-testid="timezone-display"]').should('contain', 'EST');
    });
  });

  describe('Error Handling', () => {
    it('should handle preference update errors', () => {
      cy.intercept('PUT', '/api/preferences', {
        statusCode: 500,
        body: { error: 'Failed to update preferences' },
      }).as('updatePreferences');

      cy.get('[data-testid="theme-toggle"]').click();
      cy.get('[data-testid="save-preferences"]').click();
      cy.get('[data-testid="error-message"]').should('be.visible');
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', () => {
      cy.get('[data-testid="display-name-input"]').clear();
      cy.get('[data-testid="save-preferences"]').click();
      cy.get('[data-testid="display-name-error"]').should('be.visible');
    });

    it('should validate email format', () => {
      cy.get('[data-testid="email-input"]').clear().type('invalid-email');
      cy.get('[data-testid="save-preferences"]').click();
      cy.get('[data-testid="email-error"]').should('be.visible');
    });
  });
});
