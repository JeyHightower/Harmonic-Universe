describe('Signup Flow', () => {
  beforeEach(() => {
    cy.visit('/signup');
  });

  it('should display signup form', () => {
    cy.get('input[name="username"]').should('be.visible');
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
  });

  it('should show validation errors for empty fields', () => {
    cy.get('button[type="submit"]').click();
    cy.contains('Username is required').should('be.visible');
    cy.contains('Email is required').should('be.visible');
    cy.contains('Password is required').should('be.visible');
  });

  it('should show error for invalid email format', () => {
    cy.get('input[name="username"]').type('testuser');
    cy.get('input[type="email"]').type('invalidemail');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.contains('Invalid email format').should('be.visible');
  });

  it('should show error for weak password', () => {
    cy.get('input[name="username"]').type('testuser');
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('weak');
    cy.get('button[type="submit"]').click();
    cy.contains('Password must be at least 8 characters').should('be.visible');
  });

  it('should show error for existing email', () => {
    cy.intercept('POST', '/api/auth/register', {
      statusCode: 400,
      body: {
        error: 'Email already exists',
      },
    }).as('registerRequest');

    cy.get('input[name="username"]').type('testuser');
    cy.get('input[type="email"]').type('existing@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();

    cy.wait('@registerRequest');
    cy.contains('Email already exists').should('be.visible');
  });

  it('should register successfully', () => {
    cy.intercept('POST', '/api/auth/register', {
      statusCode: 201,
      body: {
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
        },
        token: 'fake-jwt-token',
      },
    }).as('registerRequest');

    cy.get('input[name="username"]').type('testuser');
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();

    cy.wait('@registerRequest');
    cy.url().should('include', '/dashboard');
    cy.contains('Welcome, testuser').should('be.visible');
  });

  it('should handle network error', () => {
    cy.intercept('POST', '/api/auth/register', {
      statusCode: 500,
      body: {
        error: 'Internal server error',
      },
    }).as('registerRequest');

    cy.get('input[name="username"]').type('testuser');
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();

    cy.wait('@registerRequest');
    cy.contains('An error occurred. Please try again.').should('be.visible');
  });

  it('should handle rate limiting', () => {
    cy.intercept('POST', '/api/auth/register', {
      statusCode: 429,
      body: {
        error: 'Too many requests',
        retryAfter: 60,
      },
    }).as('registerRequest');

    cy.get('input[name="username"]').type('testuser');
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();

    cy.wait('@registerRequest');
    cy.contains('Too many attempts. Please try again later.').should(
      'be.visible'
    );
  });

  it('should handle login link', () => {
    cy.get('a').contains('Login').click();
    cy.url().should('include', '/login');
  });

  it('should show email verification message', () => {
    cy.intercept('POST', '/api/auth/register', {
      statusCode: 201,
      body: {
        message: 'Verification email sent',
      },
    }).as('registerRequest');

    cy.get('input[name="username"]').type('testuser');
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();

    cy.wait('@registerRequest');
    cy.contains('Please check your email to verify your account').should(
      'be.visible'
    );
  });
});
