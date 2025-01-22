import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: 'frontend/cypress/support/e2e.js',
    specPattern: 'frontend/cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    video: false,
    screenshotOnRunFailure: false,
    defaultCommandTimeout: 10000,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
    specPattern: 'frontend/cypress/components/**/*.cy.{js,jsx,ts,tsx}',
  },
  fixturesFolder: 'frontend/cypress/fixtures',
  viewportWidth: 1280,
  viewportHeight: 720,
});
