describe('Utils', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.login();
  });

  describe('Validation Utils', () => {
    it('should validate email format', () => {
      cy.window().then(win => {
        const { validateEmail } = win.utils;
        expect(validateEmail('test@example.com')).to.be.true;
        expect(validateEmail('invalid-email')).to.be.false;
        expect(validateEmail('')).to.be.false;
        expect(validateEmail('test@.com')).to.be.false;
        expect(validateEmail('test@domain')).to.be.false;
      });
    });

    it('should validate password strength', () => {
      cy.window().then(win => {
        const { validatePassword } = win.utils;
        expect(validatePassword('weakpass')).to.be.false;
        expect(validatePassword('StrongPass123!')).to.be.true;
        expect(validatePassword('')).to.be.false;
        expect(validatePassword('short')).to.be.false;
        expect(validatePassword('NoSpecialChar123')).to.be.false;
      });
    });

    it('should validate username format', () => {
      cy.window().then(win => {
        const { validateUsername } = win.utils;
        expect(validateUsername('valid_user123')).to.be.true;
        expect(validateUsername('inv@lid')).to.be.false;
        expect(validateUsername('')).to.be.false;
        expect(validateUsername('sh')).to.be.false;
        expect(validateUsername('toolongusernameexceedingmaxlength')).to.be
          .false;
      });
    });
  });

  describe('Format Utils', () => {
    it('should format dates correctly', () => {
      cy.window().then(win => {
        const { formatDate } = win.utils;
        const date = new Date('2024-01-01T12:00:00Z');
        expect(formatDate(date, 'short')).to.match(/\d{1,2}\/\d{1,2}\/\d{4}/);
        expect(formatDate(date, 'long')).to.include('January');
        expect(formatDate(date, 'relative')).to.include('ago');
        expect(formatDate(null)).to.equal('Invalid date');
      });
    });

    it('should format file sizes', () => {
      cy.window().then(win => {
        const { formatFileSize } = win.utils;
        expect(formatFileSize(1024)).to.equal('1.0 KB');
        expect(formatFileSize(1024 * 1024)).to.equal('1.0 MB');
        expect(formatFileSize(1024 * 1024 * 1024)).to.equal('1.0 GB');
        expect(formatFileSize(500)).to.equal('500 B');
        expect(formatFileSize(-1)).to.equal('Invalid size');
      });
    });

    it('should format numbers with proper separators', () => {
      cy.window().then(win => {
        const { formatNumber } = win.utils;
        expect(formatNumber(1000)).to.equal('1,000');
        expect(formatNumber(1000000)).to.equal('1,000,000');
        expect(formatNumber(1234.56)).to.equal('1,234.56');
        expect(formatNumber(-1000)).to.equal('-1,000');
        expect(formatNumber(null)).to.equal('0');
      });
    });
  });

  describe('Storage Utils', () => {
    it('should handle local storage operations', () => {
      cy.window().then(win => {
        const { storage } = win.utils;
        storage.set('testKey', { data: 'test' });
        expect(storage.get('testKey')).to.deep.equal({ data: 'test' });
        storage.remove('testKey');
        expect(storage.get('testKey')).to.be.null;
        storage.clear();
        expect(storage.get('testKey')).to.be.null;
      });
    });

    it('should handle storage errors', () => {
      cy.window().then(win => {
        const { storage } = win.utils;
        const largeData = 'x'.repeat(10 * 1024 * 1024); // 10MB
        expect(() => storage.set('largeKey', largeData)).to.throw();
        expect(storage.get('largeKey')).to.be.null;
      });
    });

    it('should handle storage versioning', () => {
      cy.window().then(win => {
        const { storage } = win.utils;
        storage.setVersion('1.0.0');
        storage.set('testKey', { data: 'test', version: '1.0.0' });
        storage.setVersion('2.0.0');
        expect(storage.get('testKey')).to.be.null;
      });
    });
  });

  describe('Error Utils', () => {
    it('should format error messages', () => {
      cy.window().then(win => {
        const { formatError } = win.utils;
        const error = new Error('Test error');
        expect(formatError(error)).to.equal('Test error');
        expect(formatError({ message: 'API error' })).to.equal('API error');
        expect(formatError('String error')).to.equal('String error');
        expect(formatError(null)).to.equal('An unknown error occurred');
      });
    });

    it('should handle API error responses', () => {
      cy.window().then(win => {
        const { handleApiError } = win.utils;
        const error = { response: { data: { message: 'API error' } } };
        expect(handleApiError(error)).to.equal('API error');
        expect(handleApiError({ response: {} })).to.equal(
          'An unknown error occurred'
        );
        expect(handleApiError(null)).to.equal('Network error');
      });
    });

    it('should categorize errors', () => {
      cy.window().then(win => {
        const { categorizeError } = win.utils;
        expect(categorizeError({ status: 404 })).to.equal('not_found');
        expect(categorizeError({ status: 401 })).to.equal('unauthorized');
        expect(categorizeError({ status: 403 })).to.equal('forbidden');
        expect(categorizeError({ status: 500 })).to.equal('server_error');
        expect(categorizeError({})).to.equal('unknown');
      });
    });
  });

  describe('Debounce Utils', () => {
    it('should debounce function calls', () => {
      cy.window().then(win => {
        const { debounce } = win.utils;
        const spy = cy.spy();
        const debouncedFn = debounce(spy, 500);

        debouncedFn();
        debouncedFn();
        debouncedFn();

        cy.wait(600).then(() => {
          expect(spy).to.be.calledOnce;
        });
      });
    });

    it('should cancel debounced calls', () => {
      cy.window().then(win => {
        const { debounce } = win.utils;
        const spy = cy.spy();
        const debouncedFn = debounce(spy, 500);

        debouncedFn();
        debouncedFn.cancel();

        cy.wait(600).then(() => {
          expect(spy).to.not.be.called;
        });
      });
    });

    it('should handle immediate execution', () => {
      cy.window().then(win => {
        const { debounce } = win.utils;
        const spy = cy.spy();
        const debouncedFn = debounce(spy, 500, true);

        debouncedFn();
        expect(spy).to.be.calledOnce;

        debouncedFn();
        debouncedFn();

        cy.wait(600).then(() => {
          expect(spy).to.be.calledTwice;
        });
      });
    });
  });

  describe('URL Utils', () => {
    it('should parse query parameters', () => {
      cy.window().then(win => {
        const { parseQueryParams } = win.utils;
        const url = 'https://example.com?key1=value1&key2=value2';
        const params = parseQueryParams(url);
        expect(params).to.deep.equal({
          key1: 'value1',
          key2: 'value2',
        });
      });
    });

    it('should build query strings', () => {
      cy.window().then(win => {
        const { buildQueryString } = win.utils;
        const params = {
          key1: 'value1',
          key2: 'value2',
        };
        expect(buildQueryString(params)).to.equal('key1=value1&key2=value2');
      });
    });

    it('should handle special characters in URLs', () => {
      cy.window().then(win => {
        const { encodeUrl, decodeUrl } = win.utils;
        const url =
          'https://example.com?key=special value&other=test@example.com';
        const encoded = encodeUrl(url);
        expect(decodeUrl(encoded)).to.equal(url);
      });
    });
  });

  describe('Color Utils', () => {
    it('should convert color formats', () => {
      cy.window().then(win => {
        const { colorUtils } = win.utils;
        expect(colorUtils.hexToRgb('#ff0000')).to.deep.equal({
          r: 255,
          g: 0,
          b: 0,
        });
        expect(colorUtils.rgbToHex(255, 0, 0)).to.equal('#ff0000');
        expect(colorUtils.isDark('#000000')).to.be.true;
        expect(colorUtils.isDark('#ffffff')).to.be.false;
      });
    });

    it('should generate color variations', () => {
      cy.window().then(win => {
        const { colorUtils } = win.utils;
        const baseColor = '#ff0000';
        expect(colorUtils.lighten(baseColor, 0.1)).to.not.equal(baseColor);
        expect(colorUtils.darken(baseColor, 0.1)).to.not.equal(baseColor);
        expect(colorUtils.alpha(baseColor, 0.5)).to.include('rgba');
      });
    });

    it('should validate color formats', () => {
      cy.window().then(win => {
        const { colorUtils } = win.utils;
        expect(colorUtils.isValidHex('#ff0000')).to.be.true;
        expect(colorUtils.isValidHex('invalid')).to.be.false;
        expect(colorUtils.isValidRgb('rgb(255, 0, 0)')).to.be.true;
        expect(colorUtils.isValidRgb('invalid')).to.be.false;
      });
    });
  });
});
