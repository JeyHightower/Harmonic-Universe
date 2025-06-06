import { AUTH_CONFIG } from '../utils/config';
import { authEndpoints } from './endpoints';
import { httpClient } from './http-client';

/**
 * DemoService class for handling demo user functionality
 */
class DemoService {
  constructor() {
    this.demoUser = {
      id: 'demo',
      email: 'demo@example.com',
      username: 'Demo User',
      role: 'user',
    };
  }

  /**
   * Check if current session is a demo session
   */
  isDemoSession() {
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    const userStr = localStorage.getItem(AUTH_CONFIG.USER_KEY);
    const user = userStr ? JSON.parse(userStr) : null;
    return user?.email === 'demo@example.com';
  }

  /**
   * Handle demo login process
   */
  async login() {
    try {
      console.log('Demo Service - Starting login process');

      // Call the backend demo login endpoint with POST
      const response = await httpClient.post(authEndpoints.demoLogin);

      if (!response?.success) {
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
  }
}

// Export singleton instance
export const demoService = new DemoService();
