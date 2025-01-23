describe('Security Testing', () => {
  beforeEach(() => {
    // Clear cookies and local storage
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  describe('Authentication Security', () => {
    it('should prevent unauthorized access to protected routes', () => {
      // Try accessing protected routes without auth
      const protectedRoutes = [
        '/dashboard',
        '/profile',
        '/settings',
        '/universe/1',
      ];

      protectedRoutes.forEach(route => {
        cy.visit(route);
        cy.url().should('include', '/login');
        cy.get('[data-testid="auth-required"]').should('be.visible');
      });
    });

    it('should handle invalid login attempts', () => {
      const attempts = [
        { email: 'invalid@example.com', password: 'wrongpass' },
        { email: '<script>alert(1)</script>', password: 'hackerman' },
        { email: '', password: '' },
        { email: 'test@example.com', password: ' '.repeat(1000) },
      ];

      attempts.forEach(({ email, password }) => {
        cy.visit('/login');
        cy.get('input[type="email"]').type(email);
        cy.get('input[type="password"]').type(password);
        cy.get('button[type="submit"]').click();
        cy.get('[data-testid="error-message"]').should('be.visible');
      });

      // Verify rate limiting
      cy.get('[data-testid="rate-limit-message"]').should('be.visible');
    });

    it('should enforce password security requirements', () => {
      cy.visit('/register');

      const weakPasswords = [
        'password',
        '12345678',
        'qwerty',
        'abcd1234',
        'test@123',
      ];

      weakPasswords.forEach(password => {
        cy.get('input[name="password"]').clear().type(password);
        cy.get('[data-testid="password-strength"]').should('contain', 'Weak');
        cy.get('button[type="submit"]').should('be.disabled');
      });

      // Test strong password
      cy.get('input[name="password"]').clear().type('StrongP@ssw0rd123!');
      cy.get('[data-testid="password-strength"]').should('contain', 'Strong');
      cy.get('button[type="submit"]').should('not.be.disabled');
    });

    it('should handle session management securely', () => {
      // Login
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          user: { id: 1, username: 'testuser' },
          token: 'fake-jwt-token',
        },
      }).as('loginRequest');

      cy.visit('/login');
      cy.get('input[type="email"]').type('test@example.com');
      cy.get('input[type="password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');

      // Verify secure cookie attributes
      cy.getCookie('session').should('have.property', 'secure', true);
      cy.getCookie('session').should('have.property', 'httpOnly', true);
      cy.getCookie('session').should('have.property', 'sameSite', 'strict');

      // Test session expiry
      cy.clock().tick(24 * 60 * 60 * 1000); // Advance 24 hours
      cy.visit('/dashboard');
      cy.url().should('include', '/login');
    });
  });

  describe('Authorization Security', () => {
    beforeEach(() => {
      // Login as regular user
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          user: { id: 2, username: 'regularuser', role: 'user' },
          token: 'fake-jwt-token',
        },
      }).as('loginRequest');

      cy.visit('/login');
      cy.get('input[type="email"]').type('user@example.com');
      cy.get('input[type="password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');
    });

    it('should prevent unauthorized access to admin features', () => {
      // Try accessing admin routes
      cy.visit('/admin/dashboard');
      cy.get('[data-testid="unauthorized-message"]').should('be.visible');
      cy.url().should('not.include', '/admin');

      // Try admin API endpoints
      cy.request({
        method: 'GET',
        url: '/api/admin/users',
        failOnStatusCode: false,
      }).then(response => {
        expect(response.status).to.eq(403);
      });
    });

    it('should enforce resource ownership checks', () => {
      // Try to access another user's private universe
      cy.intercept('GET', '/api/universes/999', {
        statusCode: 403,
        body: {
          error: 'Unauthorized access',
        },
      }).as('getUnauthorizedUniverse');

      cy.visit('/universe/999');
      cy.wait('@getUnauthorizedUniverse');
      cy.get('[data-testid="unauthorized-message"]').should('be.visible');

      // Try to modify another user's profile
      cy.request({
        method: 'PUT',
        url: '/api/users/999/profile',
        body: { name: 'Hacked' },
        failOnStatusCode: false,
      }).then(response => {
        expect(response.status).to.eq(403);
      });
    });

    it('should handle role-based permissions', () => {
      // Mock different user roles
      const roles = ['user', 'moderator', 'admin'];
      const permissions = {
        user: ['read', 'create'],
        moderator: ['read', 'create', 'update'],
        admin: ['read', 'create', 'update', 'delete'],
      };

      roles.forEach(role => {
        cy.intercept('POST', '/api/auth/login', {
          statusCode: 200,
          body: {
            user: { id: 1, username: `${role}user`, role },
            token: 'fake-jwt-token',
          },
        }).as('loginRequest');

        // Login as role
        cy.visit('/login');
        cy.get('input[type="email"]').type(`${role}@example.com`);
        cy.get('input[type="password"]').type('password123');
        cy.get('button[type="submit"]').click();
        cy.wait('@loginRequest');

        // Check available actions
        cy.visit('/universe/1');
        permissions[role].forEach(action => {
          cy.get(`[data-testid="${action}-action"]`).should('exist');
        });

        // Check unavailable actions
        Object.values(permissions)
          .flat()
          .filter(action => !permissions[role].includes(action))
          .forEach(action => {
            cy.get(`[data-testid="${action}-action"]`).should('not.exist');
          });

        cy.clearCookies();
      });
    });
  });

  describe('Input Validation and Sanitization', () => {
    beforeEach(() => {
      // Login
      cy.loginAsUser(); // Custom command for login
    });

    it('should prevent XSS attacks', () => {
      const xssPayloads = [
        '<script>alert(1)</script>',
        'javascript:alert(1)',
        '<img src="x" onerror="alert(1)">',
        '<svg onload="alert(1)">',
        '"><script>alert(1)</script>',
      ];

      // Test form inputs
      cy.visit('/universe/1/edit');
      xssPayloads.forEach(payload => {
        cy.get('[data-testid="universe-name"]').clear().type(payload);
        cy.get('[data-testid="save-universe"]').click();
        cy.get('[data-testid="universe-name-display"]').should($el => {
          expect($el.html()).not.to.include('<script>');
          expect($el.html()).not.to.include('javascript:');
          expect($el.html()).not.to.include('onerror=');
          expect($el.html()).not.to.include('onload=');
        });
      });

      // Test URL parameters
      xssPayloads.forEach(payload => {
        cy.visit(`/universe/1?name=${encodeURIComponent(payload)}`);
        cy.get('body').should($body => {
          expect($body.html()).not.to.include('<script>');
          expect($body.html()).not.to.include('javascript:');
        });
      });
    });

    it('should prevent SQL injection attempts', () => {
      const sqlInjectionPayloads = [
        "' OR '1'='1",
        '; DROP TABLE users;--',
        '1 UNION SELECT * FROM users',
        "admin'--",
        '1; SELECT * FROM users WHERE admin = 1',
      ];

      // Test search inputs
      cy.visit('/search');
      sqlInjectionPayloads.forEach(payload => {
        cy.get('[data-testid="search-input"]').clear().type(payload);
        cy.get('[data-testid="search-submit"]').click();
        cy.get('[data-testid="error-message"]').should('not.exist');
        cy.get('[data-testid="results"]').should('exist');
      });

      // Test API endpoints
      sqlInjectionPayloads.forEach(payload => {
        cy.request({
          method: 'GET',
          url: `/api/users?id=${encodeURIComponent(payload)}`,
          failOnStatusCode: false,
        }).then(response => {
          expect(response.status).to.be.oneOf([400, 404]);
        });
      });
    });

    it('should validate file uploads', () => {
      const invalidFiles = [
        { name: 'malicious.exe', type: 'application/x-msdownload' },
        { name: 'large.jpg', size: 50 * 1024 * 1024 }, // 50MB
        { name: 'script.php', type: 'application/x-php' },
      ];

      cy.visit('/profile');

      invalidFiles.forEach(file => {
        cy.get('[data-testid="avatar-upload"]').attachFile({
          fileContent: 'test content',
          fileName: file.name,
          mimeType: file.type,
        });
        cy.get('[data-testid="upload-error"]').should('be.visible');
      });

      // Test valid file
      cy.get('[data-testid="avatar-upload"]').attachFile({
        fileContent: 'test content',
        fileName: 'valid.jpg',
        mimeType: 'image/jpeg',
      });
      cy.get('[data-testid="upload-success"]').should('be.visible');
    });
  });

  describe('API Security', () => {
    it('should enforce rate limiting', () => {
      const numRequests = 100;
      const requests = [];

      // Make rapid API requests
      for (let i = 0; i < numRequests; i++) {
        requests.push(
          cy.request({
            method: 'GET',
            url: '/api/universes',
            failOnStatusCode: false,
          })
        );
      }

      // Verify rate limiting
      cy.wrap(Promise.all(requests)).then(responses => {
        const rateLimited = responses.some(r => r.status === 429);
        expect(rateLimited).to.be.true;
      });
    });

    it('should require CSRF tokens for mutations', () => {
      // Login first
      cy.loginAsUser();

      // Try mutation without CSRF token
      cy.request({
        method: 'POST',
        url: '/api/universes',
        body: { name: 'Test Universe' },
        failOnStatusCode: false,
      }).then(response => {
        expect(response.status).to.eq(403);
      });

      // Get CSRF token
      cy.getCookie('XSRF-TOKEN').then(cookie => {
        // Try mutation with CSRF token
        cy.request({
          method: 'POST',
          url: '/api/universes',
          body: { name: 'Test Universe' },
          headers: {
            'X-XSRF-TOKEN': cookie.value,
          },
        }).then(response => {
          expect(response.status).to.eq(201);
        });
      });
    });

    it('should validate API request headers', () => {
      const invalidHeaders = [
        { 'Content-Type': 'application/xml' },
        { 'X-Forwarded-For': 'malicious.com' },
        { Authorization: 'Invalid Token' },
      ];

      invalidHeaders.forEach(headers => {
        cy.request({
          method: 'GET',
          url: '/api/universes',
          headers,
          failOnStatusCode: false,
        }).then(response => {
          expect(response.status).to.be.oneOf([400, 401, 403]);
        });
      });
    });
  });

  describe('Security Headers', () => {
    it('should set secure response headers', () => {
      cy.request('/').then(response => {
        const headers = response.headers;
        expect(headers).to.include({
          'strict-transport-security': 'max-age=31536000; includeSubDomains',
          'x-content-type-options': 'nosniff',
          'x-frame-options': 'DENY',
          'x-xss-protection': '1; mode=block',
          'content-security-policy':
            expect.stringContaining("default-src 'self'"),
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should not expose sensitive information in errors', () => {
      const endpoints = [
        '/api/nonexistent',
        '/api/users/999999',
        '/api/universes/invalid',
      ];

      endpoints.forEach(endpoint => {
        cy.request({
          method: 'GET',
          url: endpoint,
          failOnStatusCode: false,
        }).then(response => {
          expect(response.status).to.be.oneOf([400, 404]);
          expect(response.body).not.to.have.any.keys(
            'stack',
            'query',
            'sql',
            'path'
          );
        });
      });
    });
  });
});
