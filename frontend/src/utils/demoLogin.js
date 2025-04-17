import { AUTH_CONFIG } from "../utils/config";
import { loginSuccess } from "../store/slices/authSlice";

/**
 * Centralized demo login function
 * Handles demo login for both development and production environments
 * @param {function} dispatch - Redux dispatch function
 */
export const demoLogin = async (dispatch) => {
  try {
    console.log("Starting centralized demo login process");

    // For production deployments, use direct demo user creation
    if (window.location.hostname.includes("render.com")) {
      console.log("Production environment detected, creating demo user directly");

      // Create mock demo user
      const demoUser = {
        id: "demo-" + Math.floor(Math.random() * 10000),
        username: "demo_user",
        email: "demo@example.com",
        role: "user",
        createdAt: new Date().toISOString(),
      };

      // Create a proper JWT-like token with three parts
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const now = Math.floor(Date.now() / 1000);
      const payload = btoa(JSON.stringify({
        sub: demoUser.id,
        name: "Demo User",
        iat: now,
        exp: now + 3600, // 1 hour from now
      }));
      const signature = btoa('demo-signature');

      // Create token with header.payload.signature format
      const mockToken = `${header}.${payload}.${signature}`;

      // Store in localStorage
      localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, mockToken);
      localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(demoUser));

      // Update Redux state
      dispatch(loginSuccess({ user: demoUser, token: mockToken }));

      console.log("Demo login successful");
      return;
    }

    // Development environment logic
    console.log("Development environment detected, using demo login action");
    const demoUser = {
      id: "demo-" + Math.floor(Math.random() * 10000),
      username: "demo_user",
      email: "demo@example.com",
      role: "user",
      createdAt: new Date().toISOString(),
    };

    // Create a proper JWT-like token with three parts
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const now = Math.floor(Date.now() / 1000);
    const payload = btoa(JSON.stringify({
      sub: demoUser.id,
      name: "Demo User",
      iat: now,
      exp: now + 3600, // 1 hour from now
    }));
    const signature = btoa('demo-signature');

    // Create token with header.payload.signature format
    const mockToken = `${header}.${payload}.${signature}`;

    // Store in localStorage
    localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, mockToken);
    localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(demoUser));

    // Update Redux state
    dispatch(loginSuccess({ user: demoUser, token: mockToken }));

    console.log("Demo login successful");
  } catch (error) {
    console.error("Error during demo login:", error);
    throw new Error("Failed to log in as demo user");
  }
}; 