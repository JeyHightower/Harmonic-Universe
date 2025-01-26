const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    setupNodeEvents(on, config) {
      on("task", {
        "reset-test-db": () => {
          // Add logic to reset test database
          return null;
        },
        "db:reset": () => {
          // This is a mock implementation - in a real app, you'd want to actually reset the database
          return null;
        },
      });
    },
    env: {
      apiUrl: "http://localhost:5000/api",
    },
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    supportFile: false,
  },
  component: {
    devServer: {
      framework: "react",
      bundler: "vite",
    },
    specPattern: "frontend/cypress/components/**/*.cy.{js,jsx,ts,tsx}",
  },
  fixturesFolder: "frontend/cypress/fixtures",
});
