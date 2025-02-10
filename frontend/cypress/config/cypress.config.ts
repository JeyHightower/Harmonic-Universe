import { defineConfig } from 'cypress';

export default defineConfig({
    e2e: {
        baseUrl: 'http://localhost:3000',
        supportFile: 'cypress/support/commands.ts',
        specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
        viewportWidth: 1920,
        viewportHeight: 1080,
        defaultCommandTimeout: 10000,
        requestTimeout: 10000,
        responseTimeout: 10000,
        pageLoadTimeout: 30000,
        video: false,
        screenshotOnRunFailure: true,
        trashAssetsBeforeRuns: true,
        chromeWebSecurity: false,
        retries: {
            runMode: 2,
            openMode: 0
        },
        env: {
            apiUrl: 'http://localhost:8000',
            wsUrl: 'ws://localhost:8000',
            coverage: false
        },
        setupNodeEvents(on, config) {
            on('task', {
                // Database tasks
                'db:reset': () => {
                    // Reset database to initial state
                    return null;
                },
                'db:seed': () => {
                    // Seed database with test data
                    return null;
                },
                'db:create:user': (user) => {
                    // Create a test user
                    return null;
                },

                // WebSocket tasks
                'mockWebSocket': ({ url, messages }) => {
                    // Mock WebSocket connection
                    return null;
                },

                // File system tasks
                'readFile': (filename) => {
                    // Read file contents
                    return null;
                },
                'writeFile': ({ filename, contents }) => {
                    // Write file contents
                    return null;
                },

                // Custom tasks
                'log': (message) => {
                    console.log(message);
                    return null;
                }
            });

            // Load environment variables
            require('dotenv').config();

            // Update configuration with environment variables
            config.env = {
                ...config.env,
                apiUrl: process.env.API_URL || config.env.apiUrl,
                wsUrl: process.env.WS_URL || config.env.wsUrl
            };

            // Enable code coverage if specified
            if (config.env.coverage) {
                require('@cypress/code-coverage/task')(on, config);
            }

            return config;
        }
    },

    component: {
        devServer: {
            framework: 'react',
            bundler: 'vite'
        },
        supportFile: 'cypress/support/component.ts',
        specPattern: 'cypress/component/**/*.cy.{js,jsx,ts,tsx}',
        viewportWidth: 1920,
        viewportHeight: 1080,
        video: false,
        screenshotOnRunFailure: true
    },

    // Global configuration
    watchForFileChanges: true,
    numTestsKeptInMemory: 50,
    experimentalMemoryManagement: true,
    experimentalWebKitSupport: true,
    reporter: 'cypress-multi-reporters',
    reporterOptions: {
        reporterEnabled: 'spec, mocha-junit-reporter',
        mochaJunitReporterReporterOptions: {
            mochaFile: 'cypress/results/results-[hash].xml'
        }
    }
});
