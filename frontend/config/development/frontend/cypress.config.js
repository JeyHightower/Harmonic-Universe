import { defineConfig } from 'cypress'

export default defineConfig({
    e2e: {
        baseUrl: 'http://localhost:5173',
        supportFile: 'cypress/support/e2e.js',
        specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
        viewportWidth: 1280,
        viewportHeight: 720,
        video: false,
        screenshotOnRunFailure: true,
        defaultCommandTimeout: 10000,
        requestTimeout: 10000,
        responseTimeout: 10000,
        setupNodeEvents(on, config) {
            // Implement node event listeners here
            on('task', {
                log(message) {
                    console.log(message)
                    return null
                },
                table(message) {
                    console.table(message)
                    return null
                }
            })
        }
    },

    env: {
        apiUrl: 'http://localhost:5000/api',
        coverage: false
    },

    retries: {
        runMode: 2,
        openMode: 0
    },

    component: {
        devServer: {
            framework: 'react',
            bundler: 'vite'
        },
        supportFile: 'cypress/support/component.js',
        specPattern: 'cypress/component/**/*.cy.{js,jsx,ts,tsx}',
        indexHtmlFile: 'cypress/support/component-index.html'
    }
})

