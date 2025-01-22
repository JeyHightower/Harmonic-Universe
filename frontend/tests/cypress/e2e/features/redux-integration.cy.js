describe('Redux Store Integration', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  describe('Authentication State', () => {
    it('should update auth state on login', () => {
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          user: {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
          },
          token: 'test-jwt-token',
        },
      }).as('loginRequest');

      cy.visit('/login');
      cy.get('[data-testid="login-email"]').type('test@example.com');
      cy.get('[data-testid="login-password"]').type('password123');
      cy.get('[data-testid="login-submit"]').click();

      cy.wait('@loginRequest');

      // Verify Redux state
      cy.window()
        .its('store')
        .invoke('getState')
        .its('auth')
        .should('deep.include', {
          isAuthenticated: true,
          user: {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
          },
          error: null,
        });
    });

    it('should clear auth state on logout', () => {
      // Login first
      cy.login();

      cy.intercept('POST', '/api/auth/logout', {
        statusCode: 200,
        body: {
          success: true,
        },
      }).as('logoutRequest');

      cy.get('[data-testid="user-menu"]').click();
      cy.get('[data-testid="logout-button"]').click();

      cy.wait('@logoutRequest');

      // Verify Redux state
      cy.window()
        .its('store')
        .invoke('getState')
        .its('auth')
        .should('deep.include', {
          isAuthenticated: false,
          user: null,
          token: null,
          error: null,
        });
    });

    it('should handle auth errors', () => {
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 401,
        body: {
          error: 'Invalid credentials',
        },
      }).as('loginError');

      cy.visit('/login');
      cy.get('[data-testid="login-email"]').type('wrong@example.com');
      cy.get('[data-testid="login-password"]').type('wrongpass');
      cy.get('[data-testid="login-submit"]').click();

      cy.wait('@loginError');

      // Verify Redux state
      cy.window()
        .its('store')
        .invoke('getState')
        .its('auth')
        .should('deep.include', {
          isAuthenticated: false,
          user: null,
          error: 'Invalid credentials',
        });
    });
  });

  describe('Universe State', () => {
    beforeEach(() => {
      cy.login();
    });

    it('should update universe state on creation', () => {
      cy.intercept('POST', '/api/universes', {
        statusCode: 200,
        body: {
          id: 1,
          name: 'Test Universe',
          description: 'Test Description',
          isPublic: false,
        },
      }).as('createUniverse');

      cy.visit('/universe/create');
      cy.get('[data-testid="universe-name"]').type('Test Universe');
      cy.get('[data-testid="universe-description"]').type('Test Description');
      cy.get('[data-testid="create-universe-submit"]').click();

      cy.wait('@createUniverse');

      // Verify Redux state
      cy.window()
        .its('store')
        .invoke('getState')
        .its('universes')
        .should('deep.include', {
          currentUniverse: {
            id: 1,
            name: 'Test Universe',
            description: 'Test Description',
            isPublic: false,
          },
          error: null,
        });
    });

    it('should update universe list on fetch', () => {
      cy.intercept('GET', '/api/universes', {
        statusCode: 200,
        body: [
          {
            id: 1,
            name: 'Universe 1',
            description: 'Description 1',
          },
          {
            id: 2,
            name: 'Universe 2',
            description: 'Description 2',
          },
        ],
      }).as('fetchUniverses');

      cy.visit('/universes');
      cy.wait('@fetchUniverses');

      // Verify Redux state
      cy.window()
        .its('store')
        .invoke('getState')
        .its('universes')
        .its('list')
        .should('have.length', 2);
    });

    it('should handle universe errors', () => {
      cy.intercept('POST', '/api/universes', {
        statusCode: 500,
        body: {
          error: 'Failed to create universe',
        },
      }).as('universeError');

      cy.visit('/universe/create');
      cy.get('[data-testid="universe-name"]').type('Test Universe');
      cy.get('[data-testid="create-universe-submit"]').click();

      cy.wait('@universeError');

      // Verify Redux state
      cy.window()
        .its('store')
        .invoke('getState')
        .its('universes')
        .should('deep.include', {
          error: 'Failed to create universe',
        });
    });
  });

  describe('Comment State', () => {
    beforeEach(() => {
      cy.login();
    });

    it('should update comments on fetch', () => {
      cy.intercept('GET', '/api/universes/1/comments', {
        statusCode: 200,
        body: [
          {
            id: 1,
            content: 'Test Comment',
            author: { id: 1, username: 'testuser' },
          },
        ],
      }).as('fetchComments');

      cy.visit('/universes/1');
      cy.wait('@fetchComments');

      // Verify Redux state
      cy.window()
        .its('store')
        .invoke('getState')
        .its('comments')
        .should('deep.include', {
          comments: [
            {
              id: 1,
              content: 'Test Comment',
              author: { id: 1, username: 'testuser' },
            },
          ],
          error: null,
        });
    });

    it('should add comment to state', () => {
      cy.intercept('POST', '/api/universes/1/comments', {
        statusCode: 200,
        body: {
          comment: {
            id: 2,
            content: 'New Comment',
            author: { id: 1, username: 'testuser' },
          },
        },
      }).as('addComment');

      cy.visit('/universes/1');
      cy.get('[data-testid="comment-input"]').type('New Comment');
      cy.get('[data-testid="submit-comment"]').click();

      cy.wait('@addComment');

      // Verify Redux state
      cy.window()
        .its('store')
        .invoke('getState')
        .its('comments')
        .its('comments')
        .should('have.length.above', 0);
    });

    it('should handle comment errors', () => {
      cy.intercept('POST', '/api/universes/1/comments', {
        statusCode: 500,
        body: {
          error: 'Failed to add comment',
        },
      }).as('commentError');

      cy.visit('/universes/1');
      cy.get('[data-testid="comment-input"]').type('New Comment');
      cy.get('[data-testid="submit-comment"]').click();

      cy.wait('@commentError');

      // Verify Redux state
      cy.window()
        .its('store')
        .invoke('getState')
        .its('comments')
        .should('deep.include', {
          error: 'Failed to add comment',
        });
    });
  });

  describe('State Persistence', () => {
    it('should persist auth token across page reloads', () => {
      // Login
      cy.login();

      // Verify token in localStorage
      cy.window().its('localStorage.token').should('exist');

      // Reload page
      cy.reload();

      // Verify Redux state maintained auth
      cy.window()
        .its('store')
        .invoke('getState')
        .its('auth')
        .its('isAuthenticated')
        .should('be.true');
    });

    it('should clear persisted state on logout', () => {
      // Login first
      cy.login();

      // Logout
      cy.get('[data-testid="user-menu"]').click();
      cy.get('[data-testid="logout-button"]').click();

      // Verify localStorage cleared
      cy.window().its('localStorage.token').should('not.exist');

      // Reload page
      cy.reload();

      // Verify Redux state is reset
      cy.window()
        .its('store')
        .invoke('getState')
        .its('auth')
        .should('deep.include', {
          isAuthenticated: false,
          user: null,
          token: null,
        });
    });
  });
});
