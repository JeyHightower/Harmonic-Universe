describe('Comment Features', () => {
  beforeEach(() => {
    // Setup mock responses for comment-related API calls
    cy.intercept('GET', '/api/comments/1', {
      statusCode: 200,
      body: {
        status: 'success',
        data: {
          comments: [
            {
              id: 1,
              content: 'Test Comment',
              user_id: 1,
              username: 'testuser',
              created_at: new Date().toISOString(),
              parent_id: null,
              replies: [],
            },
          ],
        },
      },
    }).as('getComments');

    cy.intercept('POST', '/api/comments/1', {
      statusCode: 201,
      body: {
        status: 'success',
        data: {
          comment: {
            id: 2,
            content: 'New Comment',
            user_id: 1,
            username: 'testuser',
            created_at: new Date().toISOString(),
            parent_id: null,
            replies: [],
          },
        },
      },
    }).as('createComment');

    // Login before each test
    cy.login();
    cy.visit('/universe/1');
  });

  describe('Comment Creation', () => {
    it('should create a new comment', () => {
      cy.get('[data-testid="comment-section"]').should('be.visible');
      cy.get('[data-testid="comment-input"]').type('New Comment');
      cy.get('[data-testid="submit-comment"]').click();

      cy.wait('@createComment');

      cy.get('[data-testid="comment-list"]')
        .should('contain', 'New Comment')
        .and('contain', 'testuser');
    });

    it('should validate empty comments', () => {
      cy.get('[data-testid="submit-comment"]').should('be.disabled');
      cy.get('[data-testid="comment-input"]').type('   ');
      cy.get('[data-testid="submit-comment"]').should('be.disabled');
    });

    it('should handle API errors during creation', () => {
      cy.intercept('POST', '/api/comments/1', {
        statusCode: 500,
        body: {
          status: 'error',
          message: 'Server error',
        },
      }).as('commentError');

      cy.get('[data-testid="comment-input"]').type('New Comment');
      cy.get('[data-testid="submit-comment"]').click();

      cy.wait('@commentError');
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Server error');
    });

    it('should create nested replies', () => {
      cy.get('[data-testid="comment-1"]').within(() => {
        cy.get('[data-testid="reply-button"]').click();
      });

      cy.get('[data-testid="reply-input"]').type('Reply Comment');
      cy.get('[data-testid="submit-reply"]').click();

      cy.wait('@createComment');
      cy.get('[data-testid="comment-replies"]').should(
        'contain',
        'Reply Comment'
      );
    });
  });

  describe('Comment Management', () => {
    it('should edit existing comment', () => {
      cy.intercept('PUT', '/api/comments/1', {
        statusCode: 200,
        body: {
          status: 'success',
          data: {
            comment: {
              id: 1,
              content: 'Updated Comment',
              user_id: 1,
              username: 'testuser',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          },
        },
      }).as('updateComment');

      cy.get('[data-testid="comment-1"]').within(() => {
        cy.get('[data-testid="edit-button"]').click();
        cy.get('[data-testid="edit-input"]').clear().type('Updated Comment');
        cy.get('[data-testid="save-edit"]').click();
      });

      cy.wait('@updateComment');
      cy.get('[data-testid="comment-1"]')
        .should('contain', 'Updated Comment')
        .and('contain', '(edited)');
    });

    it('should delete comment', () => {
      cy.intercept('DELETE', '/api/comments/1', {
        statusCode: 200,
        body: {
          status: 'success',
          message: 'Comment deleted successfully',
        },
      }).as('deleteComment');

      cy.get('[data-testid="comment-1"]').within(() => {
        cy.get('[data-testid="delete-button"]').click();
      });

      cy.get('[data-testid="confirm-delete"]').click();
      cy.wait('@deleteComment');
      cy.get('[data-testid="comment-1"]').should('not.exist');
    });

    it('should handle unauthorized edit attempts', () => {
      cy.intercept('PUT', '/api/comments/1', {
        statusCode: 403,
        body: {
          status: 'error',
          message: 'Unauthorized access',
        },
      }).as('unauthorizedEdit');

      cy.get('[data-testid="comment-1"]').within(() => {
        cy.get('[data-testid="edit-button"]').click();
        cy.get('[data-testid="edit-input"]').clear().type('Unauthorized Edit');
        cy.get('[data-testid="save-edit"]').click();
      });

      cy.wait('@unauthorizedEdit');
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Unauthorized access');
    });
  });

  describe('Comment Display', () => {
    it('should display comments in chronological order', () => {
      cy.intercept('GET', '/api/comments/1', {
        statusCode: 200,
        body: {
          status: 'success',
          data: {
            comments: [
              {
                id: 1,
                content: 'First Comment',
                created_at: '2024-01-01T00:00:00Z',
              },
              {
                id: 2,
                content: 'Second Comment',
                created_at: '2024-01-02T00:00:00Z',
              },
            ],
          },
        },
      }).as('getOrderedComments');

      cy.visit('/universe/1');
      cy.wait('@getOrderedComments');

      cy.get('[data-testid="comment-list"]').within(() => {
        cy.get('[data-testid="comment"]')
          .eq(0)
          .should('contain', 'First Comment');
        cy.get('[data-testid="comment"]')
          .eq(1)
          .should('contain', 'Second Comment');
      });
    });

    it('should handle empty comment list', () => {
      cy.intercept('GET', '/api/comments/1', {
        statusCode: 200,
        body: {
          status: 'success',
          data: {
            comments: [],
          },
        },
      }).as('getEmptyComments');

      cy.visit('/universe/1');
      cy.wait('@getEmptyComments');

      cy.get('[data-testid="empty-comments"]')
        .should('be.visible')
        .and('contain', 'No comments yet');
    });

    it('should format timestamps correctly', () => {
      const now = new Date();
      const comment = {
        id: 1,
        content: 'Test Comment',
        created_at: now.toISOString(),
      };

      cy.intercept('GET', '/api/comments/1', {
        statusCode: 200,
        body: {
          status: 'success',
          data: {
            comments: [comment],
          },
        },
      }).as('getTimestampComment');

      cy.visit('/universe/1');
      cy.wait('@getTimestampComment');

      cy.get('[data-testid="comment-timestamp"]').should('contain', 'just now');
    });
  });

  describe('Comment Interactions', () => {
    it('should show loading state while fetching comments', () => {
      cy.intercept('GET', '/api/comments/1', {
        delay: 1000,
        statusCode: 200,
        body: {
          status: 'success',
          data: {
            comments: [],
          },
        },
      }).as('getDelayedComments');

      cy.visit('/universe/1');
      cy.get('[data-testid="comments-loading"]').should('be.visible');
      cy.wait('@getDelayedComments');
      cy.get('[data-testid="comments-loading"]').should('not.exist');
    });

    it('should handle network errors gracefully', () => {
      cy.intercept('GET', '/api/comments/1', {
        forceNetworkError: true,
      }).as('networkError');

      cy.visit('/universe/1');
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Failed to load comments');
      cy.get('[data-testid="retry-button"]').should('be.visible');
    });

    it('should auto-update comment list after new comment', () => {
      cy.get('[data-testid="comment-input"]').type('Auto-update Test');
      cy.get('[data-testid="submit-comment"]').click();

      cy.wait('@createComment');
      cy.get('[data-testid="comment-list"]').should(
        'contain',
        'Auto-update Test'
      );
    });
  });
});
