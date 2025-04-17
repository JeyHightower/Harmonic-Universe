/**
 * Demo User Service
 * Handles demo user creation and management
 */

import { AUTH_CONFIG } from "../utils/config";
import { authService } from "./auth.service.mjs";

/**
 * Creates a demo user with randomly generated ID
 * @returns {Object} Demo user object
 */
export const createDemoUser = () => {
  const randomId = 'demo-' + Math.random().toString(36).substring(2, 10);
  return {
    id: randomId,
    username: 'demo_user',
    email: 'demo@harmonic-universe.com',
    firstName: 'Demo',
    lastName: 'User',
    role: 'user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
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
  const payload = btoa(JSON.stringify({
    sub: userId,
    name: 'Demo User',
    iat: now,
    exp: now + (tokenType === 'refresh' ? 86400 : 3600), // refresh: 24h, access: 1h
    type: tokenType // Important: add token type for backend validation
  }));
  
  // Create a signature part (just a placeholder for demo)
  const signature = btoa('demo-signature');
  
  // Return a properly formatted JWT token with 3 parts
  return `${header}.${payload}.${signature}`;
};

/**
 * Sets up a demo session with demo user and token
 * @returns {Object} Object containing demo user and token
 */
export const setupDemoSession = () => {
  console.debug("Setting up demo session");
  
  // Create demo user and tokens
  const demoUser = createDemoUser();
  const token = createDemoToken(demoUser.id, 'access');
  const refreshToken = createDemoToken(demoUser.id, 'refresh');
  
  // Store in localStorage
  localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, token);
  localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(demoUser));
  
  // Clear any token verification failure flag
  localStorage.removeItem("token_verification_failed");
  
  // Set auth header for axios
  if (window.httpClient && window.httpClient.defaults) {
    window.httpClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  
  return { user: demoUser, token, refresh_token: refreshToken };
};

/**
 * Checks if current session is a demo session
 * @returns {boolean} True if user is in demo mode
 */
export const isDemoSession = () => {
  try {
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    // Check if token exists
    if (!token) return false;
    
    // First try to determine if it's a JWT-formatted demo token
    try {
      // Check if it's a properly formatted JWT (has 3 parts)
      const parts = token.split('.');
      if (parts.length === 3) {
        // Decode the payload (middle part)
        const payload = JSON.parse(atob(parts[1]));
        
        // Check if it's a demo token by looking at the subject
        if (payload.sub && (
          payload.sub.includes('demo-') || 
          payload.sub.includes('demo_') || 
          payload.sub === 'demo-user'
        )) {
          return true;
        }
      }
    } catch (e) {
      // Decoding failed, continue to legacy check
      console.debug('JWT parsing failed during demo check:', e);
    }
    
    // Legacy check for backward compatibility
    return token.startsWith('demo-') || 
           token.includes('demo_token_') || 
           token.includes('demo-token-');
  } catch (error) {
    console.error("Error checking demo session:", error);
    return false;
  }
};

/**
 * Creates a demo login session
 * @returns {Object} Login response with demo user and token
 */
export const performDemoLogin = async () => {
  try {
    console.log("Performing demo login");
    
    // Clean up any existing auth data
    authService.clearAuthData();
    
    // Set up demo session
    const { user, token } = setupDemoSession();
    
    return {
      success: true,
      data: {
        user,
        token
      }
    };
  } catch (error) {
    console.error("Demo login failed:", error);
    return {
      success: false,
      error: error.message || "Failed to set up demo session"
    };
  }
};

/**
 * Ends demo session
 */
export const endDemoSession = () => {
  if (isDemoSession()) {
    console.log("Ending demo session");
    authService.clearAuthData();
    return true;
  }
  return false;
};

/**
 * Demo user service object
 */
export const demoUserService = {
  createDemoUser,
  setupDemoSession,
  isDemoSession,
  performDemoLogin,
  endDemoSession
};

export default demoUserService; 