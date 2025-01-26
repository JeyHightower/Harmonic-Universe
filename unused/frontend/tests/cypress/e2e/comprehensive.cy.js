describe("Comprehensive End-to-End Test Suite", () => {
  beforeEach(() => {
    // Reset database state
    cy.task("db:reset");
    // Clear local storage
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it("should test complete user journey through all major features", () => {
    // 1. Authentication Flow
    cy.visit("/login");
    cy.get('[data-testid="email-input"]').type("test@example.com");
    cy.get('[data-testid="password-input"]').type("password123");
    cy.get('[data-testid="login-button"]').click();
    cy.url().should("include", "/dashboard");

    // 2. Universe Creation
    cy.get('[data-testid="create-universe-button"]').click();
    cy.get('[data-testid="universe-name-input"]').type("Test Universe");
    cy.get('[data-testid="universe-description-input"]').type(
      "A test universe for comprehensive testing",
    );
    cy.get('[data-testid="create-submit-button"]').click();

    // 3. Parameter Management
    cy.get('[data-testid="parameter-manager"]').should("exist");

    // Test physics parameters
    cy.get('[data-testid="gravity-slider"]')
      .invoke("val", 75)
      .trigger("change");

    cy.get('[data-testid="friction-slider"]')
      .invoke("val", 0.8)
      .trigger("change");

    // Verify WebSocket updates
    cy.window()
      .its("WebSocket")
      .invoke("lastMessage")
      .should("deep.equal", {
        type: "parameter_update",
        data: {
          universe_id: Cypress.env("lastCreatedUniverseId"),
          parameter: "friction",
          value: 0.8,
        },
      });

    // 4. Real-time Updates
    cy.get('[data-testid="simulation-canvas"]').should("exist");
    cy.get('[data-testid="start-simulation-button"]').click();

    // Verify simulation starts
    cy.get('[data-testid="simulation-status"]').should("have.text", "Running");

    // 5. Error Handling
    // Test invalid parameter input
    cy.get('[data-testid="gravity-slider"]')
      .invoke("val", -1)
      .trigger("change");

    cy.get('[data-testid="error-message"]').should(
      "contain",
      "Invalid parameter value",
    );

    // 6. Security Checks
    // Attempt to access unauthorized universe
    cy.visit("/universe/999999");
    cy.get('[data-testid="error-message"]').should("contain", "Unauthorized");

    // 7. Data Persistence
    cy.reload();

    // Verify universe data persists
    cy.get('[data-testid="universe-name"]').should("contain", "Test Universe");

    cy.get('[data-testid="gravity-slider"]').should("have.value", "75");

    // 8. Cleanup
    cy.get('[data-testid="delete-universe-button"]').click();
    cy.get('[data-testid="confirm-delete-button"]').click();

    // Verify deletion
    cy.get('[data-testid="universe-list"]').should(
      "not.contain",
      "Test Universe",
    );
  });

  it("should handle offline/online scenarios", () => {
    cy.visit("/dashboard");

    // Simulate offline
    cy.window().then((win) => {
      win.dispatchEvent(new Event("offline"));
    });

    cy.get('[data-testid="offline-indicator"]').should("be.visible");

    // Verify offline functionality
    cy.get('[data-testid="create-universe-button"]').click();
    cy.get('[data-testid="offline-message"]').should(
      "contain",
      "This feature is not available offline",
    );

    // Simulate coming back online
    cy.window().then((win) => {
      win.dispatchEvent(new Event("online"));
    });

    cy.get('[data-testid="offline-indicator"]').should("not.exist");
  });

  it("should test performance under load", () => {
    cy.visit("/dashboard");

    // Create multiple universes
    for (let i = 0; i < 5; i++) {
      cy.get('[data-testid="create-universe-button"]').click();
      cy.get('[data-testid="universe-name-input"]').type(
        `Load Test Universe ${i}`,
      );
      cy.get('[data-testid="create-submit-button"]').click();

      // Verify creation completes within 2 seconds
      cy.get('[data-testid="universe-list"]', { timeout: 2000 }).should(
        "contain",
        `Load Test Universe ${i}`,
      );
    }

    // Verify UI responsiveness
    cy.get('[data-testid="universe-list"]')
      .children()
      .should("have.length", 5)
      .and("be.visible");
  });
});
