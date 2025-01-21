import '@testing-library/cypress/add-commands';
import './commands';

beforeEach(() => {
  cy.intercept('GET', '/api/health', { statusCode: 200 }).as('healthCheck');
});

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  return false;
});
