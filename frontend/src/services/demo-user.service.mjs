/**
 * Demo User Service
 * Handles demo user creation and management
 */

import { AUTH_CONFIG } from '../utils';
import { httpClient } from './http-client.mjs';

class DemoUserService {
  constructor() {
    this.demoUser = {
      id: 'demo-user',
      email: 'demo@example.com',
      username: 'Demo User',
      role: 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  isDemoSession() {
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    const userStr = localStorage.getItem(AUTH_CONFIG.USER_KEY);
    const user = userStr ? JSON.parse(userStr) : null;

    // Check both token and user email
    return this.isDemoToken(token) || user?.email === 'demo@example.com';
  }

  isDemoToken(token) {
    if (!token) return false;

    try {
      // First check if it's a JWT
      const parts = token.split('.');
      if (parts.length === 3) {
        // Try to decode the payload
        const payload = JSON.parse(atob(parts[1]));
        return (
          payload.sub &&
          (payload.sub.includes('demo-') ||
            payload.sub.includes('demo_') ||
            payload.sub === 'demo-user')
        );
      }
    } catch (e) {
      // If JWT parsing fails, check for legacy demo tokens
      return (
        token.startsWith('demo-') || token.includes('demo_token_') || token.includes('demo-token-')
      );
    }
    return false;
  }

  async setupDemoSession() {
    console.log('Setting up demo session');

    // Generate a new demo token
    const token = `demo-token-${Date.now()}`;
    const refresh_token = `demo-refresh-${Date.now()}`;

    // Store the demo data
    localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, token);
    localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, refresh_token);
    localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(this.demoUser));

    // Set up http client for demo mode
    if (httpClient?.defaults?.headers?.common) {
      httpClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    return {
      token,
      refresh_token,
      user: this.demoUser,
    };
  }

  clearDemoSession() {
    localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
    localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
    localStorage.removeItem(AUTH_CONFIG.USER_KEY);

    // Clear http client auth header
    if (httpClient?.defaults?.headers?.common) {
      delete httpClient.defaults.headers.common['Authorization'];
    }
  }
}

// Create and export a singleton instance
export const demoUserService = new DemoUserService();

/**
 * Creates a demo user with fixed ID to match backend
 * @returns {Object} Demo user object
 */
export const createDemoUser = () => {
  return {
    id: '1', // Fixed ID to match backend demo user
    username: 'demo',
    email: 'demo@example.com',
    firstName: 'Demo',
    lastName: 'User',
    role: 'user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

/**
 * Creates a properly formatted JWT-like token for demo mode
 * @param {string} userId - User ID to include in token
 * @param {string} tokenType - Type of token ('access' or 'refresh')
 * @returns {string} JWT-like token
 */
const createDemoToken = (userId, tokenType = 'access') => {
  // Create a header part (base64 encoded)
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));

  // Create a payload part (base64 encoded) with token type
  const now = Math.floor(Date.now() / 1000);
  const payload = btoa(
    JSON.stringify({
      sub: userId,
      name: 'Demo User',
      iat: now,
      exp: now + (tokenType === 'refresh' ? 86400 : 3600), // refresh: 24h, access: 1h
      type: tokenType, // Important: add token type for backend validation
    })
  );

  // Create a signature part (just a placeholder for demo)
  const signature = btoa('demo-signature');

  // Return a properly formatted JWT token with 3 parts
  return `${header}.${payload}.${signature}`;
};

/**
 * Ends demo session
 */
export const endDemoSession = () => {
  if (demoUserService.isDemoSession()) {
    console.log('Ending demo session');
    demoUserService.clearDemoSession();
    return true;
  }
  return false;
};
