import { AUTH_CONFIG } from '../utils/config';
import { authEndpoints } from './endpoints';
import { httpClient } from './http-client';

/**
 * Utility to check if a JWT token is expired
 * @param {string} token - JWT token
 * @returns {boolean} - true if expired, false otherwise
 */
function isTokenExpired(token) {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return true;
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  } catch (e) {
    return true;
  }
}

/**
 * DemoService class for handling demo user functionality
 */
class DemoService {
  constructor() {
    this.isDemoMode = false;
  }

  /**
   * Check if current session is a valid, unexpired demo session
   */
  isValidDemoSession() {
    const userStr = localStorage.getItem(AUTH_CONFIG.USER_KEY);
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    if (!userStr || !token) return false;
    try {
      const user = JSON.parse(userStr);
      if (!user?.email?.startsWith('demo_')) return false;
      if (isTokenExpired(token)) return false;
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Set up demo session only if not already valid
   */
  async setupDemoSession() {
    try {
      if (this.isValidDemoSession()) {
        return { success: true };
      }
      // Otherwise, perform demo login
      return await this.login();
    } catch (error) {
      console.error('Error setting up demo session:', error);
      throw error;
    }
  }

  /**
   * Handle demo login process
   */
  async login() {
    try {
      console.log('Demo Service - Starting login process');

      // Call the backend demo login endpoint with POST
      const response = await httpClient.post(authEndpoints.demoLogin);

      if (!response?.user) {
        throw new Error('Invalid response from demo login endpoint');
      }

      const { token, refresh_token, user } = response;

      // Store auth data
      localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, token);
      localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, refresh_token);
      localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(user));

      // Set up http client auth header
      if (httpClient?.defaults?.headers?.common) {
        httpClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      this.isDemoMode = true;

      return {
        success: true,
        token,
        refresh_token,
        user,
      };
    } catch (error) {
      console.error('Demo login failed:', error);
      throw error;
    }
  }

  /**
   * Clean up demo session data
   */
  cleanup() {
    localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
    localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
    localStorage.removeItem(AUTH_CONFIG.USER_KEY);

    if (httpClient?.defaults?.headers?.common) {
      delete httpClient.defaults.headers.common['Authorization'];
    }

    this.isDemoMode = false;
  }

  /**
   * Check if current session is a demo session (legacy, kept for compatibility)
   */
  isDemoSession() {
    return this.isValidDemoSession();
  }
}

// Export singleton instance
export const demoService = new DemoService();
