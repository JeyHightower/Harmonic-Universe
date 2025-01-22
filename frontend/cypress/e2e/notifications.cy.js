describe('Notifications', () => {
  beforeEach(() => {
    // Login before each test
    cy.request({
      method: 'POST',
      url: 'http://localhost:5000/api/auth/login',
      body: {
        email: 'test@example.com',
        password: 'password123',
      },
    }).then(response => {
      localStorage.setItem('token', response.body.token);
    });

    // Visit the home page
    cy.visit('/');
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.removeItem('token');
  });

  it('should display notifications when available', () => {
    // Mock the notifications API response
    cy.intercept('GET', 'http://localhost:5000/api/notifications', {
      statusCode: 200,
      body: [
        {
          id: 1,
          type: 'universe_invite',
          message: 'Fantasy World',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 2,
          type: 'collaboration_request',
          message: 'John Doe',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      ],
    }).as('getNotifications');

    // Click the notifications button
    cy.get('[data-testid="notifications-button"]').click();

    // Wait for the API call to complete
    cy.wait('@getNotifications');

    // Verify that notifications are displayed
    cy.get('[data-testid="notification-1"]').should('be.visible');
    cy.get('[data-testid="notification-2"]').should('be.visible');
  });

  it('should show empty state when no notifications', () => {
    // Mock the notifications API response with empty array
    cy.intercept('GET', 'http://localhost:5000/api/notifications', {
      statusCode: 200,
      body: [],
    }).as('getNotifications');

    // Click the notifications button
    cy.get('[data-testid="notifications-button"]').click();

    // Wait for the API call to complete
    cy.wait('@getNotifications');

    // Verify that empty state message is displayed
    cy.get('[data-testid="empty-state"]').should('be.visible');
  });

  it('should mark notification as read', () => {
    // Mock the notifications API response
    cy.intercept('GET', 'http://localhost:5000/api/notifications', {
      statusCode: 200,
      body: [
        {
          id: 1,
          type: 'universe_invite',
          message: 'Fantasy World',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      ],
    }).as('getNotifications');

    // Mock the mark as read API response
    cy.intercept('PATCH', 'http://localhost:5000/api/notifications/1/read', {
      statusCode: 200,
      body: {
        id: 1,
        type: 'universe_invite',
        message: 'Fantasy World',
        isRead: true,
        createdAt: new Date().toISOString(),
      },
    }).as('markAsRead');

    // Click the notifications button
    cy.get('[data-testid="notifications-button"]').click();

    // Wait for the notifications to load
    cy.wait('@getNotifications');

    // Click the "Mark as read" button
    cy.contains('Mark as read').click();

    // Wait for the mark as read API call to complete
    cy.wait('@markAsRead');

    // Verify that the notification is marked as read
    cy.get('[data-testid="notification-1"]').should(
      'have.css',
      'background-color',
      'inherit'
    );
  });

  it('should mark all notifications as read', () => {
    // Mock the notifications API response
    cy.intercept('GET', 'http://localhost:5000/api/notifications', {
      statusCode: 200,
      body: [
        {
          id: 1,
          type: 'universe_invite',
          message: 'Fantasy World',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 2,
          type: 'collaboration_request',
          message: 'John Doe',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      ],
    }).as('getNotifications');

    // Mock the mark all as read API response
    cy.intercept(
      'POST',
      'http://localhost:5000/api/notifications/mark-all-read',
      {
        statusCode: 200,
        body: [],
      }
    ).as('markAllAsRead');

    // Click the notifications button
    cy.get('[data-testid="notifications-button"]').click();

    // Wait for the notifications to load
    cy.wait('@getNotifications');

    // Click the "Mark all as read" button
    cy.contains('Mark all as read').click();

    // Wait for the mark all as read API call to complete
    cy.wait('@markAllAsRead');

    // Verify that all notifications are marked as read
    cy.get('[data-testid="notification-1"]').should(
      'have.css',
      'background-color',
      'inherit'
    );
    cy.get('[data-testid="notification-2"]').should(
      'have.css',
      'background-color',
      'inherit'
    );
  });

  it('should delete a notification', () => {
    // Mock the notifications API response
    cy.intercept('GET', 'http://localhost:5000/api/notifications', {
      statusCode: 200,
      body: [
        {
          id: 1,
          type: 'universe_invite',
          message: 'Fantasy World',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      ],
    }).as('getNotifications');

    // Mock the delete API response
    cy.intercept('DELETE', 'http://localhost:5000/api/notifications/1', {
      statusCode: 200,
    }).as('deleteNotification');

    // Click the notifications button
    cy.get('[data-testid="notifications-button"]').click();

    // Wait for the notifications to load
    cy.wait('@getNotifications');

    // Click the delete button
    cy.contains('Delete').click();

    // Wait for the delete API call to complete
    cy.wait('@deleteNotification');

    // Verify that the notification is removed
    cy.get('[data-testid="notification-1"]').should('not.exist');
  });

  it('should handle errors gracefully', () => {
    // Mock the notifications API response with an error
    cy.intercept('GET', 'http://localhost:5000/api/notifications', {
      statusCode: 500,
      body: {
        error: 'Internal Server Error',
      },
    }).as('getNotifications');

    // Click the notifications button
    cy.get('[data-testid="notifications-button"]').click();

    // Wait for the API call to complete
    cy.wait('@getNotifications');

    // Verify that error message is displayed
    cy.contains('Error loading notifications').should('be.visible');
  });

  describe('Real-time Updates', () => {
    it('should show new notification when received', () => {
      // Mock the initial notifications API response
      cy.intercept('GET', 'http://localhost:5000/api/notifications', {
        statusCode: 200,
        body: [],
      }).as('getNotifications');

      // Click the notifications button
      cy.get('[data-testid="notifications-button"]').click();

      // Wait for the initial notifications to load
      cy.wait('@getNotifications');

      // Simulate receiving a new notification via WebSocket
      cy.window().then(win => {
        const newNotification = {
          id: 1,
          type: 'universe_invite',
          message: 'New Universe',
          isRead: false,
          createdAt: new Date().toISOString(),
        };
        win.dispatchEvent(
          new CustomEvent('notification', { detail: newNotification })
        );
      });

      // Verify that the new notification is displayed
      cy.get('[data-testid="notification-1"]').should('be.visible');
    });
  });
});
