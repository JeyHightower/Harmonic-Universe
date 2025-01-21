describe('Notifications & Social Features', () => {
  beforeEach(() => {
    // Mock login
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        user: { id: 1, username: 'testuser' },
        token: 'fake-jwt-token',
      },
    }).as('loginRequest');

    // Mock notifications
    cy.intercept('GET', '/api/notifications', {
      statusCode: 200,
      body: {
        notifications: [
          {
            id: 1,
            type: 'collaboration_invite',
            content: 'You have been invited to collaborate on Test Universe',
            sender: { id: 2, username: 'otheruser' },
            target: { type: 'universe', id: 1, name: 'Test Universe' },
            created_at: '2024-01-20T12:00:00Z',
            read: false,
          },
          {
            id: 2,
            type: 'comment',
            content: 'New comment on your storyboard',
            sender: { id: 3, username: 'commenter' },
            target: { type: 'storyboard', id: 1, name: 'Test Storyboard' },
            created_at: '2024-01-19T12:00:00Z',
            read: true,
          },
        ],
        unread_count: 1,
      },
    }).as('getNotifications');

    // Mock social data
    cy.intercept('GET', '/api/users/1/social', {
      statusCode: 200,
      body: {
        followers: [
          {
            id: 2,
            username: 'follower1',
            avatar_url: 'https://example.com/avatar1.jpg',
            followed_at: '2024-01-15T12:00:00Z',
          },
        ],
        following: [
          {
            id: 3,
            username: 'creator1',
            avatar_url: 'https://example.com/avatar2.jpg',
            followed_at: '2024-01-10T12:00:00Z',
          },
        ],
        activity: [
          {
            id: 1,
            type: 'universe_created',
            user: { id: 1, username: 'testuser' },
            target: { type: 'universe', id: 1, name: 'New Universe' },
            created_at: '2024-01-20T12:00:00Z',
          },
        ],
      },
    }).as('getSocial');

    // Mock comments
    cy.intercept('GET', '/api/universes/1/comments', {
      statusCode: 200,
      body: {
        comments: [
          {
            id: 1,
            content: 'Great universe!',
            user: { id: 2, username: 'commenter' },
            created_at: '2024-01-20T12:00:00Z',
            likes: 5,
          },
        ],
      },
    }).as('getComments');

    // Login and navigate
    cy.login();
    cy.visit('/notifications');
    cy.wait(['@getNotifications', '@getSocial']);
  });

  describe('Notifications', () => {
    it('should display notifications list', () => {
      cy.get('[data-testid="notifications-list"]').within(() => {
        // Unread notification
        cy.get('[data-testid="notification-1"]')
          .should('have.class', 'unread')
          .and('contain', 'Test Universe')
          .and('contain', 'otheruser');

        // Read notification
        cy.get('[data-testid="notification-2"]')
          .should('not.have.class', 'unread')
          .and('contain', 'Test Storyboard')
          .and('contain', 'commenter');
      });

      // Unread count
      cy.get('[data-testid="unread-count"]').should('contain', '1');
    });

    it('should mark notifications as read', () => {
      cy.intercept('POST', '/api/notifications/1/read', {
        statusCode: 200,
        body: {
          message: 'Notification marked as read',
        },
      }).as('markRead');

      cy.get('[data-testid="notification-1"]').click();
      cy.wait('@markRead');
      cy.get('[data-testid="notification-1"]').should(
        'not.have.class',
        'unread'
      );
      cy.get('[data-testid="unread-count"]').should('contain', '0');
    });

    it('should handle notification actions', () => {
      // Accept collaboration invite
      cy.intercept('POST', '/api/universes/1/collaborators', {
        statusCode: 200,
        body: {
          message: 'Collaboration accepted',
        },
      }).as('acceptCollaboration');

      cy.get('[data-testid="notification-1"]')
        .find('[data-testid="accept-collaboration"]')
        .click();
      cy.wait('@acceptCollaboration');
      cy.get('[data-testid="success-message"]').should(
        'contain',
        'Collaboration accepted'
      );
    });

    it('should manage notification preferences', () => {
      cy.intercept('PUT', '/api/users/1/notification-preferences', {
        statusCode: 200,
        body: {
          preferences: {
            email_notifications: true,
            push_notifications: false,
            notification_types: ['collaboration', 'comment'],
          },
        },
      }).as('updatePreferences');

      cy.get('[data-testid="notification-settings"]').click();
      cy.get('[data-testid="email-notifications"]').check();
      cy.get('[data-testid="push-notifications"]').uncheck();
      cy.get('[data-testid="notification-type-collaboration"]').check();
      cy.get('[data-testid="notification-type-comment"]').check();
      cy.get('[data-testid="save-preferences"]').click();

      cy.wait('@updatePreferences');
      cy.get('[data-testid="success-message"]').should(
        'contain',
        'Preferences updated'
      );
    });
  });

  describe('Social Features', () => {
    it('should display followers and following', () => {
      cy.visit('/profile/social');
      cy.wait('@getSocial');

      // Followers
      cy.get('[data-testid="followers-list"]').within(() => {
        cy.get('[data-testid="follower-2"]')
          .should('contain', 'follower1')
          .find('img')
          .should('have.attr', 'src', 'https://example.com/avatar1.jpg');
      });

      // Following
      cy.get('[data-testid="following-list"]').within(() => {
        cy.get('[data-testid="following-3"]')
          .should('contain', 'creator1')
          .find('img')
          .should('have.attr', 'src', 'https://example.com/avatar2.jpg');
      });
    });

    it('should handle follow/unfollow', () => {
      // Follow user
      cy.intercept('POST', '/api/users/4/follow', {
        statusCode: 200,
        body: {
          message: 'User followed successfully',
        },
      }).as('followUser');

      cy.get('[data-testid="user-4"]')
        .find('[data-testid="follow-button"]')
        .click();
      cy.wait('@followUser');
      cy.get('[data-testid="success-message"]').should(
        'contain',
        'User followed successfully'
      );

      // Unfollow user
      cy.intercept('POST', '/api/users/3/unfollow', {
        statusCode: 200,
        body: {
          message: 'User unfollowed successfully',
        },
      }).as('unfollowUser');

      cy.get('[data-testid="following-3"]')
        .find('[data-testid="unfollow-button"]')
        .click();
      cy.wait('@unfollowUser');
      cy.get('[data-testid="success-message"]').should(
        'contain',
        'User unfollowed successfully'
      );
    });

    it('should handle comments', () => {
      cy.visit('/universes/1');
      cy.wait('@getComments');

      // Display comments
      cy.get('[data-testid="comments-section"]').within(() => {
        cy.get('[data-testid="comment-1"]')
          .should('contain', 'Great universe!')
          .and('contain', 'commenter')
          .and('contain', '5');
      });

      // Add comment
      cy.intercept('POST', '/api/universes/1/comments', {
        statusCode: 201,
        body: {
          id: 2,
          content: 'New comment',
          user: { id: 1, username: 'testuser' },
          created_at: '2024-01-20T13:00:00Z',
          likes: 0,
        },
      }).as('addComment');

      cy.get('[data-testid="comment-input"]').type('New comment');
      cy.get('[data-testid="submit-comment"]').click();
      cy.wait('@addComment');
      cy.get('[data-testid="comment-2"]').should('contain', 'New comment');

      // Like comment
      cy.intercept('POST', '/api/comments/1/like', {
        statusCode: 200,
        body: {
          likes: 6,
        },
      }).as('likeComment');

      cy.get('[data-testid="comment-1"]')
        .find('[data-testid="like-button"]')
        .click();
      cy.wait('@likeComment');
      cy.get('[data-testid="comment-1"]')
        .find('[data-testid="likes-count"]')
        .should('contain', '6');
    });

    it('should display activity feed', () => {
      cy.visit('/activity');
      cy.wait('@getSocial');

      cy.get('[data-testid="activity-feed"]').within(() => {
        cy.get('[data-testid="activity-1"]')
          .should('contain', 'testuser')
          .and('contain', 'created')
          .and('contain', 'New Universe');
      });

      // Filter activity
      cy.get('[data-testid="activity-filter"]').select('universe_created');
      cy.get('[data-testid="activity-feed"]').should('contain', 'New Universe');
    });
  });

  describe('Error Handling', () => {
    it('should handle notification errors', () => {
      cy.intercept('GET', '/api/notifications', {
        statusCode: 500,
        body: {
          error: 'Failed to fetch notifications',
        },
      }).as('notificationError');

      cy.reload();
      cy.wait('@notificationError');
      cy.get('[data-testid="error-message"]').should(
        'contain',
        'Failed to fetch notifications'
      );
    });

    it('should handle social feature errors', () => {
      // Follow error
      cy.intercept('POST', '/api/users/4/follow', {
        statusCode: 400,
        body: {
          error: 'Cannot follow yourself',
        },
      }).as('followError');

      cy.get('[data-testid="user-4"]')
        .find('[data-testid="follow-button"]')
        .click();
      cy.wait('@followError');
      cy.get('[data-testid="error-message"]').should(
        'contain',
        'Cannot follow yourself'
      );

      // Comment error
      cy.intercept('POST', '/api/universes/1/comments', {
        statusCode: 400,
        body: {
          error: 'Comment too long',
        },
      }).as('commentError');

      cy.visit('/universes/1');
      cy.get('[data-testid="comment-input"]').type('x'.repeat(1001));
      cy.get('[data-testid="submit-comment"]').click();
      cy.wait('@commentError');
      cy.get('[data-testid="error-message"]').should(
        'contain',
        'Comment too long'
      );
    });
  });
});
