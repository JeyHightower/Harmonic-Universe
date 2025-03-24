import { AUTH_CONFIG, SECURITY_CONFIG, FEATURES } from './config';
import CookieService from './cookieService';
import { apiClient } from './api';

/**
 * Service for handling secure authentication operations
 * Implements token refresh, rate limiting, and security features
 */
class AuthService {
  private static instance: AuthService;
  private loginAttempts: Map<string, { count: number; timestamp: number }> = new Map();
  private refreshPromise: Promise<any> | null = null;

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Login with rate limiting and security checks
   * @param {Object} credentials - User credentials
   * @returns {Promise<Object>} Authentication response
   */
  async login(credentials: { email: string; password: string }): Promise<any> {
    // Check rate limiting
    if (this.isRateLimited(credentials.email)) {
      throw new Error('Too many login attempts. Please try again later.');
    }

    try {
      const response = await apiClient.login(credentials);
      
      // Store tokens securely
      CookieService.setAuthTokens(response.tokens);
      
      // Reset login attempts on success
      this.loginAttempts.delete(credentials.email);
      
      return response;
    } catch (error) {
      // Increment failed attempts
      this.incrementLoginAttempts(credentials.email);
      throw error;
    }
  }

  /**
   * Register with password validation
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Registration response
   */
  async register(userData: { email: string; password: string; username: string }): Promise<any> {
    // Validate password strength
    this.validatePassword(userData.password);

    try {
      const response = await apiClient.register(userData);
      CookieService.setAuthTokens(response.tokens);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Logout and clear all auth data
   */
  async logout(): Promise<void> {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      CookieService.removeAuthTokens();
    }
  }

  /**
   * Refresh access token
   * @returns {Promise<Object>} New tokens
   */
  async refreshToken(): Promise<any> {
    // Prevent multiple refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const tokens = CookieService.getAuthTokens();
        if (!tokens.refresh_token) {
          throw new Error('No refresh token available');
        }

        const response = await apiClient.refreshToken(tokens.refresh_token);
        CookieService.setAuthTokens(response.tokens);
        return response;
      } catch (error) {
        // Clear tokens on refresh failure
        CookieService.removeAuthTokens();
        throw error;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @throws {Error} If password doesn't meet requirements
   */
  private validatePassword(password: string): void {
    const { MIN_LENGTH, MAX_LENGTH, REQUIRE_UPPERCASE, REQUIRE_LOWERCASE, REQUIRE_NUMBERS, REQUIRE_SYMBOLS } = SECURITY_CONFIG.PASSWORD;

    if (password.length < MIN_LENGTH) {
      throw new Error(`Password must be at least ${MIN_LENGTH} characters long`);
    }
    if (password.length > MAX_LENGTH) {
      throw new Error(`Password must be less than ${MAX_LENGTH} characters`);
    }
    if (REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter');
    }
    if (REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
      throw new Error('Password must contain at least one lowercase letter');
    }
    if (REQUIRE_NUMBERS && !/[0-9]/.test(password)) {
      throw new Error('Password must contain at least one number');
    }
    if (REQUIRE_SYMBOLS && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      throw new Error('Password must contain at least one special character');
    }
  }

  /**
   * Check if user is rate limited
   * @param {string} email - User email
   * @returns {boolean} True if rate limited
   */
  private isRateLimited(email: string): boolean {
    const { WINDOW, MAX_REQUESTS } = SECURITY_CONFIG.RATE_LIMIT;
    const attempts = this.loginAttempts.get(email);

    if (!attempts) {
      return false;
    }

    // Reset if window has passed
    if (Date.now() - attempts.timestamp > WINDOW) {
      this.loginAttempts.delete(email);
      return false;
    }

    return attempts.count >= MAX_REQUESTS;
  }

  /**
   * Increment failed login attempts
   * @param {string} email - User email
   */
  private incrementLoginAttempts(email: string): void {
    const attempts = this.loginAttempts.get(email) || { count: 0, timestamp: Date.now() };
    attempts.count++;
    this.loginAttempts.set(email, attempts);
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} True if authenticated
   */
  isAuthenticated(): boolean {
    return CookieService.isAuthenticated();
  }

  /**
   * Get current user tokens
   * @returns {Object} Current tokens
   */
  getTokens(): any {
    return CookieService.getAuthTokens();
  }
}

export default AuthService.getInstance(); 