describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('should display login form', () => {
    cy.get('form').should('exist');
    cy.get('input[type="email"]').should('exist');
    cy.get('input[type="password"]').should('exist');
    cy.get('button[type="submit"]').should('exist');
  });

  it('should show validation errors for invalid input', () => {
    cy.get('button[type="submit"]').click();
    cy.get('.error-message').should('exist');

    cy.get('input[type="email"]').type('invalid-email');
    cy.get('button[type="submit"]').click();
    cy.get('.error-message').should('contain', 'valid email');
  });

  it('should handle failed login attempt', () => {
    cy.get('input[type="email"]').type('wrong@example.com');
    cy.get('input[type="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();
    cy.get('.error-message').should('contain', 'Invalid credentials');
  });

  it('should successfully log in with valid credentials', () => {
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
    cy.get('.user-menu').should('exist');
  });

  it('should maintain session after page reload', () => {
    cy.login('test@example.com', 'password123');
    cy.visit('/dashboard');
    cy.reload();
    cy.url().should('include', '/dashboard');
  });

  it('should redirect to login when token expires', () => {
    cy.login('test@example.com', 'password123');
    cy.visit('/dashboard');
    // Simulate token expiration
    cy.window().then(win => {
      win.localStorage.setItem('token', 'expired-token');
    });
    cy.visit('/dashboard');
    cy.url().should('include', '/login');
  });

  it('should successfully log out', () => {
    cy.login('test@example.com', 'password123');
    cy.visit('/dashboard');
    cy.get('.logout-button').click();
    cy.url().should('include', '/login');
    cy.window().then(win => {
      expect(win.localStorage.getItem('token')).to.be.null;
    });
  });
});
