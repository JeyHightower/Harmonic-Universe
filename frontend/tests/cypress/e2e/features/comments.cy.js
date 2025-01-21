describe('Comments System Features', () => {
  beforeEach(() => {
    // Mock authentication
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        user: { id: 1, username: 'testuser' },
        token: 'fake-jwt-token',
      },
    }).as('loginRequest');

    // Mock initial comments
    cy.intercept('GET', '/api/universes/1/comments*', {
      statusCode: 200,
      body: {
        comments: [
          {
            id: 1,
            content: 'Initial comment',
            author: { id: 1, username: 'testuser' },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            reactions: { '👍': 5, '❤️': 3 },
            replyCount: 2,
            isEdited: false,
          },
        ],
        total: 1,
        hasMore: false,
      },
    }).as('getComments');

    // Login and navigate
    cy.visit('/login');
    cy.get('[data-testid="login-email"]').type('test@example.com');
    cy.get('[data-testid="login-password"]').type('password123');
    cy.get('[data-testid="login-submit"]').click();
    cy.wait('@loginRequest');

    cy.visit('/universes/1/comments');
    cy.wait('@getComments');
  });

  describe('Comment Creation', () => {
    it('should create new comment', () => {
      cy.intercept('POST', '/api/universes/1/comments', {
        statusCode: 200,
        body: {
          id: 2,
          content: 'New comment',
          author: { id: 1, username: 'testuser' },
          createdAt: new Date().toISOString(),
          reactions: {},
          replyCount: 0,
        },
      }).as('createComment');

      cy.get('[data-testid="comment-input"]').type('New comment');
      cy.get('[data-testid="submit-comment"]').click();
      cy.wait('@createComment');

      cy.get('[data-testid="comment-2"]').should('contain', 'New comment');
    });

    it('should handle rich text formatting', () => {
      cy.get('[data-testid="comment-input"]').type('**Bold text**');
      cy.get('[data-testid="format-preview"]')
        .should('contain', 'Bold text')
        .find('strong')
        .should('exist');

      cy.get('[data-testid="comment-input"]').clear().type('`code block`');
      cy.get('[data-testid="format-preview"]')
        .should('contain', 'code block')
        .find('code')
        .should('exist');
    });
  });

  describe('Comment Threading', () => {
    it('should create reply', () => {
      cy.intercept('POST', '/api/comments/1/replies', {
        statusCode: 200,
        body: {
          id: 3,
          content: 'Reply comment',
          author: { id: 1, username: 'testuser' },
          parentId: 1,
          createdAt: new Date().toISOString(),
          reactions: {},
        },
      }).as('createReply');

      cy.get('[data-testid="reply-button-1"]').click();
      cy.get('[data-testid="reply-input-1"]').type('Reply comment');
      cy.get('[data-testid="submit-reply-1"]').click();
      cy.wait('@createReply');

      cy.get('[data-testid="comment-3"]')
        .should('contain', 'Reply comment')
        .and('have.class', 'reply');
    });

    it('should load nested replies', () => {
      cy.intercept('GET', '/api/comments/1/replies', {
        statusCode: 200,
        body: {
          replies: [
            {
              id: 4,
              content: 'Nested reply',
              author: { id: 2, username: 'user2' },
              parentId: 1,
              createdAt: new Date().toISOString(),
            },
          ],
        },
      }).as('getReplies');

      cy.get('[data-testid="view-replies-1"]').click();
      cy.wait('@getReplies');

      cy.get('[data-testid="comment-4"]')
        .should('contain', 'Nested reply')
        .and('have.class', 'nested');
    });
  });

  describe('Comment Editing', () => {
    it('should edit comment', () => {
      cy.intercept('PUT', '/api/comments/1', {
        statusCode: 200,
        body: {
          content: 'Updated comment',
          isEdited: true,
          updatedAt: new Date().toISOString(),
        },
      }).as('updateComment');

      cy.get('[data-testid="edit-comment-1"]').click();
      cy.get('[data-testid="edit-input-1"]').clear().type('Updated comment');
      cy.get('[data-testid="save-edit-1"]').click();
      cy.wait('@updateComment');

      cy.get('[data-testid="comment-1"]')
        .should('contain', 'Updated comment')
        .and('contain', '(edited)');
    });

    it('should delete comment', () => {
      cy.intercept('DELETE', '/api/comments/1', {
        statusCode: 200,
      }).as('deleteComment');

      cy.get('[data-testid="delete-comment-1"]').click();
      cy.get('[data-testid="confirm-delete"]').click();
      cy.wait('@deleteComment');

      cy.get('[data-testid="comment-1"]').should('not.exist');
    });
  });

  describe('Reactions', () => {
    it('should add reaction', () => {
      cy.intercept('POST', '/api/comments/1/reactions', {
        statusCode: 200,
        body: {
          reactions: { '👍': 6, '❤️': 3 },
        },
      }).as('addReaction');

      cy.get('[data-testid="react-👍-1"]').click();
      cy.wait('@addReaction');

      cy.get('[data-testid="reaction-count-👍-1"]').should('contain', '6');
    });

    it('should remove reaction', () => {
      cy.intercept('DELETE', '/api/comments/1/reactions/👍', {
        statusCode: 200,
        body: {
          reactions: { '👍': 4, '❤️': 3 },
        },
      }).as('removeReaction');

      cy.get('[data-testid="react-👍-1"]').click();
      cy.wait('@removeReaction');

      cy.get('[data-testid="reaction-count-👍-1"]').should('contain', '4');
    });
  });

  describe('Notifications', () => {
    it('should notify on mentions', () => {
      cy.intercept('POST', '/api/universes/1/comments', {
        statusCode: 200,
        body: {
          id: 5,
          content: '@user2 Check this out',
          mentions: ['user2'],
        },
      }).as('mentionComment');

      cy.get('[data-testid="comment-input"]').type('@user2 Check this out');
      cy.get('[data-testid="submit-comment"]').click();
      cy.wait('@mentionComment');

      cy.get('[data-testid="mention-notification"]').should('be.visible');
    });

    it('should subscribe to thread', () => {
      cy.intercept('POST', '/api/comments/1/subscribe', {
        statusCode: 200,
        body: {
          subscribed: true,
        },
      }).as('subscribe');

      cy.get('[data-testid="subscribe-thread-1"]').click();
      cy.wait('@subscribe');

      cy.get('[data-testid="subscribe-thread-1"]').should(
        'have.class',
        'subscribed'
      );
    });
  });

  describe('Moderation', () => {
    it('should flag inappropriate content', () => {
      cy.intercept('POST', '/api/comments/1/flag', {
        statusCode: 200,
        body: {
          status: 'flagged',
          moderationQueue: true,
        },
      }).as('flagComment');

      cy.get('[data-testid="flag-comment-1"]').click();
      cy.get('[data-testid="flag-reason"]').select('inappropriate');
      cy.get('[data-testid="submit-flag"]').click();
      cy.wait('@flagComment');

      cy.get('[data-testid="comment-1"]').should('have.class', 'flagged');
    });

    it('should handle moderation actions', () => {
      // Mock moderator role
      cy.intercept('GET', '/api/auth/user', {
        statusCode: 200,
        body: {
          roles: ['moderator'],
        },
      }).as('checkRole');

      cy.intercept('PUT', '/api/comments/1/moderate', {
        statusCode: 200,
        body: {
          status: 'hidden',
          moderatedBy: 'testuser',
        },
      }).as('moderateComment');

      cy.get('[data-testid="moderate-comment-1"]').click();
      cy.get('[data-testid="moderation-action"]').select('hide');
      cy.get('[data-testid="apply-moderation"]').click();
      cy.wait('@moderateComment');

      cy.get('[data-testid="comment-1"]').should('have.class', 'hidden');
    });
  });

  describe('Error Handling', () => {
    it('should handle creation errors', () => {
      cy.intercept('POST', '/api/universes/1/comments', {
        statusCode: 500,
        body: {
          error: 'Failed to create comment',
        },
      }).as('createError');

      cy.get('[data-testid="comment-input"]').type('Error comment');
      cy.get('[data-testid="submit-comment"]').click();
      cy.wait('@createError');

      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Failed to create comment');
    });

    it('should handle rate limiting', () => {
      cy.intercept('POST', '/api/universes/1/comments', {
        statusCode: 429,
        body: {
          error: 'Too many comments',
          retryAfter: 60,
        },
      }).as('rateLimitError');

      cy.get('[data-testid="comment-input"]').type('Rate limited comment');
      cy.get('[data-testid="submit-comment"]').click();
      cy.wait('@rateLimitError');

      cy.get('[data-testid="rate-limit-message"]')
        .should('be.visible')
        .and('contain', 'Try again in 1 minute');
    });
  });
});
