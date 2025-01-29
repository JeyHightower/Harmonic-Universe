describe('Authentication', () => {
    beforeEach(() => {
        cy.visit('/');
    });

    it('should show login form', () => {
        cy.visit('/login');
        cy.get('input[name="username"]').should('exist');
        cy.get('input[name="password"]').should('exist');
        cy.get('button[type="submit"]').should('exist');
    });

    it('should show registration form', () => {
        cy.visit('/register');
        cy.get('input[name="username"]').should('exist');
        cy.get('input[name="email"]').should('exist');
        cy.get('input[name="password"]').should('exist');
        cy.get('button[type="submit"]').should('exist');
    });

    it('should handle login', () => {
        cy.visit('/login');
        cy.get('input[name="username"]').type('testuser');
        cy.get('input[name="password"]').type('password123');
        cy.get('button[type="submit"]').click();

        // Add assertions based on your app's behavior after login
        cy.url().should('include', '/dashboard');
    });

    it('should handle registration', () => {
        cy.visit('/register');
        cy.get('input[name="username"]').type('newuser');
        cy.get('input[name="email"]').type('newuser@example.com');
        cy.get('input[name="password"]').type('password123');
        cy.get('button[type="submit"]').click();

        // Add assertions based on your app's behavior after registration
        cy.url().should('include', '/login');
    });
});
