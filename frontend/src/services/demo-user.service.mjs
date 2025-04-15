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
 * Sets up a demo session with demo user and token
 * @returns {Object} Object containing demo user and token
 */
export const setupDemoSession = () => {
  console.debug("Setting up demo session");
  
  // Create demo user and tokens
  const demoUser = createDemoUser();
  const token = `demo-token-${demoUser.id}-${Date.now()}`;
  const refreshToken = `demo-refresh-${demoUser.id}-${Date.now()}`;
  
  // Store in localStorage
  localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, token);
  localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(demoUser));
  
  // Clear any token verification failure flag
  localStorage.removeItem("token_verification_failed");
  
  return { user: demoUser, token };
};

/**
 * Checks if current session is a demo session
 * @returns {boolean} True if user is in demo mode
 */
export const isDemoSession = () => {
  try {
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    return token && (token.startsWith('demo-') || token.includes('demo'));
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