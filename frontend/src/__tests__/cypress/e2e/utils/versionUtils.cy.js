describe('Version Utils', () => {
  describe('Version Comparison', () => {
    it('should compare version numbers correctly', () => {
      cy.window().then(win => {
        // Test version comparison
        cy.wrap(win.compareVersions('1.0.0', '1.0.1')).should('be.lessThan', 0);
        cy.wrap(win.compareVersions('1.0.1', '1.0.0')).should(
          'be.greaterThan',
          0
        );
        cy.wrap(win.compareVersions('1.0.0', '1.0.0')).should('equal', 0);
      });
    });

    it('should handle different version number lengths', () => {
      cy.window().then(win => {
        // Test comparison with different lengths
        cy.wrap(win.compareVersions('1.0', '1.0.0')).should('equal', 0);
        cy.wrap(win.compareVersions('1.0.0.0', '1.0.0')).should('equal', 0);
      });
    });

    it('should handle pre-release versions', () => {
      cy.window().then(win => {
        // Test pre-release version comparison
        cy.wrap(win.compareVersions('1.0.0-alpha', '1.0.0')).should(
          'be.lessThan',
          0
        );
        cy.wrap(win.compareVersions('1.0.0-beta', '1.0.0-alpha')).should(
          'be.greaterThan',
          0
        );
      });
    });
  });

  describe('Version Validation', () => {
    it('should validate semantic version format', () => {
      cy.window().then(win => {
        // Test version validation
        cy.wrap(win.isValidVersion('1.0.0')).should('be.true');
        cy.wrap(win.isValidVersion('1.0')).should('be.true');
        cy.wrap(win.isValidVersion('1')).should('be.false');
        cy.wrap(win.isValidVersion('1.0.0.0')).should('be.false');
      });
    });

    it('should validate pre-release version format', () => {
      cy.window().then(win => {
        // Test pre-release version validation
        cy.wrap(win.isValidVersion('1.0.0-alpha')).should('be.true');
        cy.wrap(win.isValidVersion('1.0.0-beta.1')).should('be.true');
        cy.wrap(win.isValidVersion('1.0.0-')).should('be.false');
      });
    });

    it('should validate build metadata format', () => {
      cy.window().then(win => {
        // Test build metadata validation
        cy.wrap(win.isValidVersion('1.0.0+build.1')).should('be.true');
        cy.wrap(win.isValidVersion('1.0.0-alpha+build.1')).should('be.true');
        cy.wrap(win.isValidVersion('1.0.0+')).should('be.false');
      });
    });
  });

  describe('Version Formatting', () => {
    it('should normalize version numbers', () => {
      cy.window().then(win => {
        // Test version normalization
        cy.wrap(win.normalizeVersion('1.0')).should('equal', '1.0.0');
        cy.wrap(win.normalizeVersion('1')).should('equal', '1.0.0');
        cy.wrap(win.normalizeVersion('1.0.0.0')).should('equal', '1.0.0');
      });
    });

    it('should format version display', () => {
      cy.window().then(win => {
        // Test version display formatting
        cy.wrap(win.formatVersion('1.0.0-alpha+build.1')).should(
          'equal',
          'v1.0.0-alpha'
        );
        cy.wrap(win.formatVersion('1.0.0')).should('equal', 'v1.0.0');
      });
    });

    it('should extract version components', () => {
      cy.window().then(win => {
        // Test version component extraction
        cy.wrap(win.extractVersionComponents('1.0.0-alpha+build.1')).should(
          'deep.equal',
          {
            major: 1,
            minor: 0,
            patch: 0,
            prerelease: 'alpha',
            build: 'build.1',
          }
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid version strings', () => {
      cy.window().then(win => {
        // Test error handling for invalid versions
        cy.wrap(() => win.compareVersions('invalid', '1.0.0')).should('throw');
        cy.wrap(() => win.normalizeVersion('invalid')).should('throw');
      });
    });

    it('should handle undefined or null versions', () => {
      cy.window().then(win => {
        // Test error handling for undefined/null
        cy.wrap(() => win.compareVersions(undefined, '1.0.0')).should('throw');
        cy.wrap(() => win.normalizeVersion(null)).should('throw');
      });
    });

    it('should handle malformed version strings', () => {
      cy.window().then(win => {
        // Test error handling for malformed versions
        cy.wrap(() => win.compareVersions('1.0.0.', '1.0.0')).should('throw');
        cy.wrap(() => win.normalizeVersion('1..0')).should('throw');
      });
    });
  });
});
