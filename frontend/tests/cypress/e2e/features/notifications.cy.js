describe('Notifications', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.login();
    cy.intercept('GET', '/api/notifications', {
      statusCode: 200,
      body: {
        notifications: [
          {
            id: 1,
            type: 'info',
            message: 'Test notification',
            read: false,
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
      },
    }).as('getNotifications');
  });

  describe('Notification Display', () => {
    it('should display notifications when available', () => {
      cy.get('[data-testid="notifications-icon"]').click();
      cy.get('[data-testid="notification-list"]').should('be.visible');
      cy.get('[data-testid="notification-item"]').should('have.length', 1);
    });

    it('should show empty state when no notifications', () => {
      cy.intercept('GET', '/api/notifications', {
        statusCode: 200,
        body: { notifications: [] },
      }).as('getEmptyNotifications');
      cy.get('[data-testid="notifications-icon"]').click();
      cy.get('[data-testid="empty-notifications"]').should('be.visible');
    });

    it('should display different notification types correctly', () => {
      cy.intercept('GET', '/api/notifications', {
        statusCode: 200,
        body: {
          notifications: [
            {
              id: 1,
              type: 'success',
              message: 'Success notification',
              read: false,
            },
            {
              id: 2,
              type: 'error',
              message: 'Error notification',
              read: false,
            },
            {
              id: 3,
              type: 'warning',
              message: 'Warning notification',
              read: false,
            },
          ],
        },
      }).as('getNotificationTypes');
      cy.get('[data-testid="notifications-icon"]').click();
      cy.get('[data-testid="notification-success"]').should('exist');
      cy.get('[data-testid="notification-error"]').should('exist');
      cy.get('[data-testid="notification-warning"]').should('exist');
    });
  });

  describe('Notification Actions', () => {
    it('should mark notification as read when clicked', () => {
      cy.intercept('PUT', '/api/notifications/1/read', {
        statusCode: 200,
        body: { success: true },
      }).as('markAsRead');
      cy.get('[data-testid="notifications-icon"]').click();
      cy.get('[data-testid="notification-item"]').click();
      cy.wait('@markAsRead');
      cy.get('[data-testid="notification-item"]').should('have.class', 'read');
    });

    it('should dismiss notification', () => {
      cy.intercept('DELETE', '/api/notifications/1', {
        statusCode: 200,
        body: { success: true },
      }).as('dismissNotification');
      cy.get('[data-testid="notifications-icon"]').click();
      cy.get('[data-testid="notification-dismiss"]').click();
      cy.wait('@dismissNotification');
      cy.get('[data-testid="notification-item"]').should('not.exist');
    });

    it('should mark all notifications as read', () => {
      cy.intercept('PUT', '/api/notifications/read-all', {
        statusCode: 200,
        body: { success: true },
      }).as('markAllAsRead');
      cy.get('[data-testid="notifications-icon"]').click();
      cy.get('[data-testid="mark-all-read"]').click();
      cy.wait('@markAllAsRead');
      cy.get('[data-testid="notification-item"]').should('have.class', 'read');
    });
  });

  describe('Real-time Updates', () => {
    it('should handle new notification arrival', () => {
      cy.window().then(win => {
        win.socket.emit('notification:new', {
          id: 2,
          type: 'info',
          message: 'New notification',
          read: false,
        });
      });
      cy.get('[data-testid="notification-badge"]').should('be.visible');
      cy.get('[data-testid="notifications-icon"]').click();
      cy.get('[data-testid="notification-item"]').should('have.length', 2);
    });

    it('should update notification count badge', () => {
      cy.intercept('GET', '/api/notifications/unread-count', {
        statusCode: 200,
        body: { count: 3 },
      }).as('getUnreadCount');
      cy.get('[data-testid="notification-badge"]').should('contain', '3');
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch errors gracefully', () => {
      cy.intercept('GET', '/api/notifications', {
        statusCode: 500,
        body: { error: 'Internal Server Error' },
      }).as('getNotificationsError');
      cy.get('[data-testid="notifications-icon"]').click();
      cy.get('[data-testid="notifications-error"]').should('be.visible');
      cy.get('[data-testid="retry-button"]').should('exist');
    });

    it('should handle action errors gracefully', () => {
      cy.intercept('PUT', '/api/notifications/1/read', {
        statusCode: 500,
        body: { error: 'Failed to mark as read' },
      }).as('markAsReadError');
      cy.get('[data-testid="notifications-icon"]').click();
      cy.get('[data-testid="notification-item"]').click();
      cy.get('[data-testid="action-error"]').should('be.visible');
    });
  });

  describe('Performance', () => {
    it('should handle large number of notifications', () => {
      const notifications = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        type: 'info',
        message: `Notification ${i + 1}`,
        read: false,
      }));
      cy.intercept('GET', '/api/notifications', {
        statusCode: 200,
        body: { notifications },
      }).as('getLargeNotifications');
      cy.get('[data-testid="notifications-icon"]').click();
      cy.get('[data-testid="notification-list"]').should('exist');
      cy.get('[data-testid="notification-item"]').should('have.length', 100);
    });

    it('should implement infinite scroll for large lists', () => {
      cy.intercept('GET', '/api/notifications?page=2', {
        statusCode: 200,
        body: {
          notifications: [
            {
              id: 2,
              type: 'info',
              message: 'Paginated notification',
              read: false,
            },
          ],
        },
      }).as('getMoreNotifications');
      cy.get('[data-testid="notifications-icon"]').click();
      cy.get('[data-testid="notification-list"]').scrollTo('bottom');
      cy.wait('@getMoreNotifications');
      cy.get('[data-testid="notification-item"]').should('have.length.gt', 1);
    });
  });
});
