describe('Color Utils', () => {
  describe('Color Format Conversion', () => {
    it('should convert hex to RGB', () => {
      cy.window().then(win => {
        const hex = '#FF0000';
        // Test conversion and verify RGB values
        cy.wrap(win.hexToRgb(hex)).should('deep.equal', { r: 255, g: 0, b: 0 });
      });
    });

    it('should convert RGB to hex', () => {
      cy.window().then(win => {
        const rgb = { r: 255, g: 0, b: 0 };
        // Test conversion and verify hex value
        cy.wrap(win.rgbToHex(rgb)).should('equal', '#FF0000');
      });
    });

    it('should handle shorthand hex codes', () => {
      cy.window().then(win => {
        const hex = '#F00';
        // Test conversion and verify expanded hex
        cy.wrap(win.expandHex(hex)).should('equal', '#FF0000');
      });
    });
  });

  describe('Color Validation', () => {
    it('should validate hex color codes', () => {
      cy.window().then(win => {
        const validHex = '#FF0000';
        const invalidHex = '#XY0000';
        // Test validation
        cy.wrap(win.isValidHex(validHex)).should('be.true');
        cy.wrap(win.isValidHex(invalidHex)).should('be.false');
      });
    });

    it('should validate RGB values', () => {
      cy.window().then(win => {
        const validRgb = { r: 255, g: 0, b: 0 };
        const invalidRgb = { r: 300, g: 0, b: 0 };
        // Test validation
        cy.wrap(win.isValidRgb(validRgb)).should('be.true');
        cy.wrap(win.isValidRgb(invalidRgb)).should('be.false');
      });
    });
  });

  describe('Color Manipulation', () => {
    it('should lighten colors', () => {
      cy.window().then(win => {
        const hex = '#FF0000';
        const amount = 0.2;
        // Test lightening and verify result
        cy.wrap(win.lighten(hex, amount)).should('equal', '#FF3333');
      });
    });

    it('should darken colors', () => {
      cy.window().then(win => {
        const hex = '#FF0000';
        const amount = 0.2;
        // Test darkening and verify result
        cy.wrap(win.darken(hex, amount)).should('equal', '#CC0000');
      });
    });

    it('should adjust color opacity', () => {
      cy.window().then(win => {
        const hex = '#FF0000';
        const opacity = 0.5;
        // Test opacity adjustment and verify result
        cy.wrap(win.setOpacity(hex, opacity)).should('equal', '#FF000080');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid hex codes gracefully', () => {
      cy.window().then(win => {
        const invalidHex = 'not-a-color';
        // Test error handling
        cy.wrap(() => win.hexToRgb(invalidHex)).should('throw');
      });
    });

    it('should handle invalid RGB values gracefully', () => {
      cy.window().then(win => {
        const invalidRgb = { r: 'invalid', g: 0, b: 0 };
        // Test error handling
        cy.wrap(() => win.rgbToHex(invalidRgb)).should('throw');
      });
    });

    it('should handle missing values gracefully', () => {
      cy.window().then(win => {
        // Test error handling for undefined/null values
        cy.wrap(() => win.hexToRgb(undefined)).should('throw');
        cy.wrap(() => win.rgbToHex(null)).should('throw');
      });
    });
  });
});
