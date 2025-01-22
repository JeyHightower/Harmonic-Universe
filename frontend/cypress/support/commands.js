// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

Cypress.Commands.add('login', (email, password) => {
  cy.request({
    method: 'POST',
    url: 'http://localhost:5000/api/auth/login',
    body: { email, password },
  }).then(response => {
    window.localStorage.setItem('token', response.body.token);
  });
});

Cypress.Commands.add('logout', () => {
  window.localStorage.removeItem('token');
});

Cypress.Commands.add(
  'createUniverse',
  ({ name, description, isPublic = true, allowGuests = true }) => {
    const token = window.localStorage.getItem('token');
    cy.request({
      method: 'POST',
      url: 'http://localhost:5000/api/universes',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: {
        name,
        description,
        isPublic,
        allowGuests,
      },
    });
  }
);

Cypress.Commands.add('deleteUniverse', universeId => {
  const token = window.localStorage.getItem('token');
  cy.request({
    method: 'DELETE',
    url: `http://localhost:5000/api/universes/${universeId}`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
});

Cypress.Commands.add('createTestUniverse', (options = {}) => {
  const defaultOptions = {
    name: 'Test Universe',
    description: 'Test Description',
    isPublic: false,
    maxParticipants: 10,
    physics: {
      gravity: 9.81,
      friction: 0.5,
      elasticity: 0.7,
    },
    audio: {
      volume: 1.0,
      tempo: 120,
      scale: 'major',
    },
  };

  const universeOptions = { ...defaultOptions, ...options };

  cy.request({
    method: 'POST',
    url: 'http://localhost:5000/api/universes',
    headers: {
      Authorization: `Bearer ${window.localStorage.getItem('token')}`,
    },
    body: universeOptions,
  }).then(response => {
    return response.body;
  });
});
