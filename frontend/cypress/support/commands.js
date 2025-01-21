// Custom commands for authentication
Cypress.Commands.add('login', (email, password) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/login`,
    body: { email, password },
  }).then(response => {
    window.localStorage.setItem('token', response.body.token);
    return response;
  });
});

Cypress.Commands.add('logout', () => {
  window.localStorage.removeItem('token');
  cy.visit('/login');
});

// Custom commands for universe management
Cypress.Commands.add(
  'createUniverse',
  (name, description = '', isPublic = true) => {
    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/universes`,
      headers: {
        Authorization: `Bearer ${window.localStorage.getItem('token')}`,
      },
      body: {
        name,
        description,
        is_public: isPublic,
      },
    });
  }
);

Cypress.Commands.add('deleteUniverse', universeId => {
  cy.request({
    method: 'DELETE',
    url: `${Cypress.env('apiUrl')}/universes/${universeId}`,
    headers: {
      Authorization: `Bearer ${window.localStorage.getItem('token')}`,
    },
  });
});

// Custom commands for WebSocket testing
Cypress.Commands.add('mockWebSocket', () => {
  cy.window().then(win => {
    win.WebSocket = class MockWebSocket {
      constructor(url) {
        this.url = url;
        this.readyState = 1;
        setTimeout(() => {
          if (this.onopen) this.onopen();
        }, 0);
      }
      send(data) {}
      close() {}
    };
  });
});

// Custom commands for performance testing
Cypress.Commands.add('measurePageLoad', url => {
  cy.visit(url, {
    onBeforeLoad: win => {
      win.performance.mark('start-loading');
    },
    onLoad: win => {
      win.performance.mark('end-loading');
      win.performance.measure('page-load', 'start-loading', 'end-loading');
    },
  });
});

// Custom commands for visual testing
Cypress.Commands.add('compareSnapshot', name => {
  cy.screenshot(name, { capture: 'viewport' });
});
