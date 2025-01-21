describe('Login Flow', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('should display login form', () => {
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
  });

  it('should show validation errors for empty fields', () => {
    cy.get('button[type="submit"]').click();
    cy.contains('Email is required').should('be.visible');
    cy.contains('Password is required').should('be.visible');
  });

  it('should show error for invalid credentials', () => {
    cy.get('input[type="email"]').type('invalid@example.com');
    cy.get('input[type="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();
    cy.contains('Invalid credentials').should('be.visible');
  });

  it('should login successfully', () => {
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
        },
        token: 'fake-jwt-token',
      },
    }).as('loginRequest');

    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginRequest');
    cy.url().should('include', '/dashboard');
    cy.contains('Welcome, testuser').should('be.visible');
  });

  it('should handle network error', () => {
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 500,
      body: {
        error: 'Internal server error',
      },
    }).as('loginRequest');

    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginRequest');
    cy.contains('An error occurred. Please try again.').should('be.visible');
  });

  it('should handle rate limiting', () => {
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 429,
      body: {
        error: 'Too many requests',
        retryAfter: 60,
      },
    }).as('loginRequest');

    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginRequest');
    cy.contains('Too many attempts. Please try again later.').should(
      'be.visible'
    );
  });

  it('should persist login state', () => {
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
        },
        token: 'fake-jwt-token',
      },
    }).as('loginRequest');

    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginRequest');
    cy.reload();
    cy.url().should('include', '/dashboard');
    cy.contains('Welcome, testuser').should('be.visible');
  });

  it('should handle password reset link', () => {
    cy.get('a').contains('Forgot password?').click();
    cy.url().should('include', '/reset-password');
  });

  it('should handle signup link', () => {
    cy.get('a').contains('Sign up').click();
    cy.url().should('include', '/signup');
  });
});
