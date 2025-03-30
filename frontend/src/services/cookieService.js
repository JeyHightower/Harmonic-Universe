import { AUTH_CONFIG } from './config';

/**
 * Service for handling secure cookie operations
 * Uses HttpOnly cookies for secure token storage
 */
class CookieService {
  /**
   * Set a secure cookie
   * @param {string} name - Cookie name
   * @param {string} value - Cookie value
   * @param {Object} options - Cookie options
   */
  static setCookie(name, value, options = {}) {
    const secure = AUTH_CONFIG.COOKIE_SECURE;
    const sameSite = AUTH_CONFIG.COOKIE_SAMESITE;
    const domain = AUTH_CONFIG.COOKIE_DOMAIN;
    const maxAge = options.maxAge || AUTH_CONFIG.TOKEN_EXPIRY;

    document.cookie = `${name}=${value}; path=/; domain=${domain}; max-age=${maxAge}; secure=${secure}; samesite=${sameSite}; httponly`;
  }

  /**
   * Get a cookie by name
   * @param {string} name - Cookie name
   * @returns {string|null} Cookie value or null if not found
   */
  static getCookie(name) {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [cookieName, cookieValue] = cookie.split('=').map(c => c.trim());
      if (cookieName === name) {
        return cookieValue;
      }
    }
    return null;
  }

  /**
   * Remove a cookie
   * @param {string} name - Cookie name
   */
  static removeCookie(name) {
    document.cookie = `${name}=; path=/; domain=${AUTH_CONFIG.COOKIE_DOMAIN}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }

  /**
   * Set authentication tokens in cookies
   * @param {Object} tokens - Authentication tokens
   */
  static setAuthTokens(tokens) {
    if (tokens.access_token) {
      this.setCookie('access_token', tokens.access_token, {
        maxAge: AUTH_CONFIG.TOKEN_EXPIRY
      });
    }
    if (tokens.refresh_token) {
      this.setCookie('refresh_token', tokens.refresh_token, {
        maxAge: AUTH_CONFIG.REFRESH_TOKEN_EXPIRY
      });
    }
  }

  /**
   * Get authentication tokens from cookies
   * @returns {Object} Authentication tokens
   */
  static getAuthTokens() {
    return {
      access_token: this.getCookie('access_token'),
      refresh_token: this.getCookie('refresh_token')
    };
  }

  /**
   * Remove authentication tokens
   */
  static removeAuthTokens() {
    this.removeCookie('access_token');
    this.removeCookie('refresh_token');
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} True if user has valid access token
   */
  static isAuthenticated() {
    return !!this.getCookie('access_token');
  }
}

export default CookieService; 