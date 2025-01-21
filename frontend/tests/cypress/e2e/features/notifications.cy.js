describe('Notifications Features', () => {
  beforeEach(() => {
    // Mock authentication
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        user: { id: 1, username: 'testuser' },
        token: 'fake-jwt-token',
      },
    }).as('loginRequest');

    // Mock notifications list
    cy.intercept('GET', '/api/notifications', {
      statusCode: 200,
      body: {
        notifications: [
          {
            id: 1,
            type: 'collaboration',
            message: 'User2 invited you to collaborate',
            read: false,
            createdAt: Date.now() - 1000,
          },
          {
            id: 2,
            type: 'system',
            message: 'System maintenance scheduled',
            read: true,
            createdAt: Date.now() - 2000,
          },
        ],
        unreadCount: 1,
      },
    }).as('getNotifications');

    // Login and navigate
    cy.visit('/login');
    cy.get('[data-testid="login-email"]').type('test@example.com');
    cy.get('[data-testid="login-password"]').type('password123');
    cy.get('[data-testid="login-submit"]').click();
    cy.wait('@loginRequest');

    cy.visit('/notifications');
    cy.wait('@getNotifications');
  });

  describe('Notification Display', () => {
    it('should display notification list', () => {
      cy.get('[data-testid="notifications-list"]').within(() => {
        cy.get('[data-testid="notification-1"]')
          .should('contain', 'User2 invited you to collaborate')
          .and('have.class', 'unread');

        cy.get('[data-testid="notification-2"]')
          .should('contain', 'System maintenance scheduled')
          .and('have.class', 'read');
      });
    });

    it('should show unread count', () => {
      cy.get('[data-testid="notification-badge"]')
        .should('be.visible')
        .and('contain', '1');
    });

    it('should filter notifications', () => {
      cy.get('[data-testid="filter-collaboration"]').click();
      cy.get('[data-testid="notifications-list"]')
        .should('contain', 'User2 invited you to collaborate')
        .and('not.contain', 'System maintenance scheduled');

      cy.get('[data-testid="filter-system"]').click();
      cy.get('[data-testid="notifications-list"]')
        .should('contain', 'System maintenance scheduled')
        .and('not.contain', 'User2 invited you to collaborate');
    });
  });

  describe('Notification Actions', () => {
    it('should mark notification as read', () => {
      cy.intercept('PUT', '/api/notifications/1/read', {
        statusCode: 200,
        body: {
          id: 1,
          read: true,
        },
      }).as('markRead');

      cy.get('[data-testid="notification-1"]').click();
      cy.wait('@markRead');

      cy.get('[data-testid="notification-1"]').should('have.class', 'read');
      cy.get('[data-testid="notification-badge"]').should('contain', '0');
    });

    it('should mark all notifications as read', () => {
      cy.intercept('PUT', '/api/notifications/read-all', {
        statusCode: 200,
        body: {
          success: true,
          unreadCount: 0,
        },
      }).as('markAllRead');

      cy.get('[data-testid="mark-all-read"]').click();
      cy.wait('@markAllRead');

      cy.get('[data-testid="notifications-list"]')
        .find('.unread')
        .should('not.exist');
      cy.get('[data-testid="notification-badge"]').should('contain', '0');
    });

    it('should delete notification', () => {
      cy.intercept('DELETE', '/api/notifications/1', {
        statusCode: 200,
        body: {
          success: true,
        },
      }).as('deleteNotification');

      cy.get('[data-testid="notification-1"]')
        .find('[data-testid="delete-notification"]')
        .click();
      cy.wait('@deleteNotification');

      cy.get('[data-testid="notification-1"]').should('not.exist');
    });

    it('should clear all notifications', () => {
      cy.intercept('DELETE', '/api/notifications/clear-all', {
        statusCode: 200,
        body: {
          success: true,
        },
      }).as('clearAll');

      cy.get('[data-testid="clear-all"]').click();
      cy.get('[data-testid="confirm-clear"]').click();
      cy.wait('@clearAll');

      cy.get('[data-testid="notifications-list"]').should('be.empty');
      cy.get('[data-testid="empty-state"]')
        .should('be.visible')
        .and('contain', 'No notifications');
    });
  });

  describe('Real-time Notifications', () => {
    it('should receive new notification', () => {
      // Simulate receiving new notification via WebSocket
      cy.window().then(win => {
        win.notificationSocket.onmessage({
          data: JSON.stringify({
            type: 'notification',
            data: {
              id: 3,
              type: 'mention',
              message: 'User3 mentioned you in a comment',
              read: false,
              createdAt: Date.now(),
            },
          }),
        });
      });

      cy.get('[data-testid="notification-3"]')
        .should('be.visible')
        .and('contain', 'User3 mentioned you in a comment')
        .and('have.class', 'unread');

      cy.get('[data-testid="notification-badge"]').should('contain', '2');
    });

    it('should show notification toast', () => {
      // Simulate receiving new notification while on different page
      cy.visit('/dashboard');

      cy.window().then(win => {
        win.notificationSocket.onmessage({
          data: JSON.stringify({
            type: 'notification',
            data: {
              id: 3,
              type: 'mention',
              message: 'User3 mentioned you in a comment',
              read: false,
              createdAt: Date.now(),
            },
          }),
        });
      });

      cy.get('[data-testid="notification-toast"]')
        .should('be.visible')
        .and('contain', 'User3 mentioned you in a comment');
    });
  });

  describe('Notification Settings', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/notifications/settings', {
        statusCode: 200,
        body: {
          email: true,
          push: true,
          desktop: false,
          types: {
            collaboration: true,
            mention: true,
            system: false,
          },
        },
      }).as('getSettings');

      cy.get('[data-testid="notification-settings"]').click();
      cy.wait('@getSettings');
    });

    it('should update notification channels', () => {
      cy.intercept('PUT', '/api/notifications/settings', {
        statusCode: 200,
        body: {
          email: false,
          push: true,
          desktop: true,
        },
      }).as('updateSettings');

      cy.get('[data-testid="email-notifications"]').uncheck();
      cy.get('[data-testid="desktop-notifications"]').check();
      cy.get('[data-testid="save-settings"]').click();
      cy.wait('@updateSettings');

      cy.get('[data-testid="settings-success"]')
        .should('be.visible')
        .and('contain', 'Settings updated successfully');
    });

    it('should update notification types', () => {
      cy.intercept('PUT', '/api/notifications/settings/types', {
        statusCode: 200,
        body: {
          types: {
            collaboration: true,
            mention: false,
            system: true,
          },
        },
      }).as('updateTypes');

      cy.get('[data-testid="mention-notifications"]').uncheck();
      cy.get('[data-testid="system-notifications"]').check();
      cy.get('[data-testid="save-settings"]').click();
      cy.wait('@updateTypes');

      cy.get('[data-testid="settings-success"]')
        .should('be.visible')
        .and('contain', 'Settings updated successfully');
    });

    it('should request desktop notification permission', () => {
      cy.window().then(win => {
        cy.stub(win.Notification, 'requestPermission').resolves('granted');
      });

      cy.get('[data-testid="enable-desktop-notifications"]').click();

      cy.get('[data-testid="desktop-notifications"]').should('be.checked');
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch errors', () => {
      cy.intercept('GET', '/api/notifications', {
        statusCode: 500,
        body: {
          error: 'Failed to fetch notifications',
        },
      }).as('fetchError');

      cy.reload();
      cy.wait('@fetchError');

      cy.get('[data-testid="fetch-error"]')
        .should('be.visible')
        .and('contain', 'Failed to fetch notifications');
    });

    it('should handle action errors', () => {
      cy.intercept('PUT', '/api/notifications/1/read', {
        statusCode: 500,
        body: {
          error: 'Failed to mark notification as read',
        },
      }).as('actionError');

      cy.get('[data-testid="notification-1"]').click();
      cy.wait('@actionError');

      cy.get('[data-testid="action-error"]')
        .should('be.visible')
        .and('contain', 'Failed to mark notification as read');
    });

    it('should handle settings update errors', () => {
      cy.intercept('PUT', '/api/notifications/settings', {
        statusCode: 500,
        body: {
          error: 'Failed to update settings',
        },
      }).as('settingsError');

      cy.get('[data-testid="notification-settings"]').click();
      cy.get('[data-testid="email-notifications"]').uncheck();
      cy.get('[data-testid="save-settings"]').click();
      cy.wait('@settingsError');

      cy.get('[data-testid="settings-error"]')
        .should('be.visible')
        .and('contain', 'Failed to update settings');
    });

    it('should handle WebSocket connection errors', () => {
      cy.window().then(win => {
        win.notificationSocket.onerror();
      });

      cy.get('[data-testid="connection-error"]')
        .should('be.visible')
        .and('contain', 'Connection lost');

      cy.get('[data-testid="retry-connection"]').should('be.visible').click();
    });
  });
});
