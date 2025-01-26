describe("Comprehensive End-to-End Test Suite", () => {
  beforeEach(() => {
    // Reset database state
    cy.task("db:reset");
    // Clear local storage and cookies
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it("should complete the full user journey", () => {
    // 1. Authentication Flow
    cy.visit("/login");
    cy.get("[data-testid=register-link]").click();
    cy.get("[data-testid=username-input]").type("testuser");
    cy.get("[data-testid=email-input]").type("test@example.com");
    cy.get("[data-testid=password-input]").type("Test123!");
    cy.get("[data-testid=register-button]").click();
    cy.url().should("include", "/dashboard");
    cy.get("[data-testid=user-profile]").should("contain", "testuser");

    // 2. Universe Creation
    cy.get("[data-testid=create-universe-button]").click();
    cy.get("[data-testid=universe-name-input]").type("Test Universe");
    cy.get("[data-testid=universe-description-input]").type(
      "A test universe description",
    );
    cy.get("[data-testid=create-universe-submit]").click();
    cy.url().should("include", "/universe/");

    // 3. Parameter Management
    cy.get("[data-testid=parameter-manager]").should("exist");
    cy.get("[data-testid=gravity-input]").clear().type("5.0");
    cy.get("[data-testid=friction-input]").clear().type("0.3");
    cy.get("[data-testid=apply-parameters]").click();

    // Verify WebSocket message was sent
    cy.window().its("WebSocket").should("have.property", "OPEN");
    cy.get("[data-testid=parameter-status]").should("contain", "Updated");

    // 4. Real-time Updates
    cy.get("[data-testid=start-simulation]").click();
    cy.get("[data-testid=simulation-status]").should("contain", "Running");

    // 5. Error Handling
    cy.get("[data-testid=gravity-input]").clear().type("-1");
    cy.get("[data-testid=apply-parameters]").click();
    cy.get("[data-testid=error-message]").should(
      "contain",
      "Gravity must be positive",
    );

    // 6. Privacy Settings
    cy.get("[data-testid=privacy-toggle]").click();
    cy.get("[data-testid=privacy-status]").should("contain", "Private");

    // Create another user and verify access
    cy.get("[data-testid=logout-button]").click();
    cy.get("[data-testid=register-link]").click();
    cy.get("[data-testid=username-input]").type("other_user");
    cy.get("[data-testid=email-input]").type("other@example.com");
    cy.get("[data-testid=password-input]").type("Other123!");
    cy.get("[data-testid=register-button]").click();

    // Try to access private universe
    cy.visit(Cypress.env("lastUniverseUrl"));
    cy.get("[data-testid=error-message]").should(
      "contain",
      "You do not have access to this universe",
    );

    // 7. Data Persistence
    cy.get("[data-testid=logout-button]").click();
    cy.get("[data-testid=email-input]").type("test@example.com");
    cy.get("[data-testid=password-input]").type("Test123!");
    cy.get("[data-testid=login-button]").click();
    cy.visit("/dashboard");
    cy.get("[data-testid=universe-list]").should("contain", "Test Universe");

    // 8. Universe Deletion
    cy.get("[data-testid=universe-card]").first().click();
    cy.get("[data-testid=delete-universe]").click();
    cy.get("[data-testid=confirm-delete]").click();
    cy.get("[data-testid=universe-list]").should(
      "not.contain",
      "Test Universe",
    );

    // 9. Profile Management
    cy.get("[data-testid=profile-settings]").click();
    cy.get("[data-testid=update-username]").clear().type("updated_user");
    cy.get("[data-testid=save-profile]").click();
    cy.get("[data-testid=user-profile]").should("contain", "updated_user");
  });

  it("should handle offline/online scenarios", () => {
    cy.visit("/login");
    cy.get("[data-testid=email-input]").type("test@example.com");
    cy.get("[data-testid=password-input]").type("Test123!");
    cy.get("[data-testid=login-button]").click();

    // Go offline
    cy.window().then((win) => {
      win.dispatchEvent(new Event("offline"));
    });
    cy.get("[data-testid=offline-indicator]").should("be.visible");

    // Go online
    cy.window().then((win) => {
      win.dispatchEvent(new Event("online"));
    });
    cy.get("[data-testid=offline-indicator]").should("not.exist");
  });

  it("should handle performance under load", () => {
    cy.visit("/login");
    cy.get("[data-testid=email-input]").type("test@example.com");
    cy.get("[data-testid=password-input]").type("Test123!");
    cy.get("[data-testid=login-button]").click();

    // Create multiple universes
    for (let i = 0; i < 5; i++) {
      cy.get("[data-testid=create-universe-button]").click();
      cy.get("[data-testid=universe-name-input]").type(`Test Universe ${i}`);
      cy.get("[data-testid=create-universe-submit]").click();
      cy.url().should("include", "/universe/");
      cy.visit("/dashboard");
    }

    // Verify UI responsiveness
    cy.get("[data-testid=universe-list]")
      .children()
      .should("have.length", 5)
      .and("be.visible");
  });
});
