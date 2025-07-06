/**
 * Authentication Flow Test Script
 * This script can be run in the browser console to test the authentication flow
 */

// Test configuration
const AUTH_CONFIG = {
  TOKEN_KEY: 'token',
  USER_KEY: 'user',
  REFRESH_TOKEN_KEY: 'refreshToken',
};

// Utility functions
const clearAuthData = () => {
  localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
  localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
  localStorage.removeItem(AUTH_CONFIG.USER_KEY);
  console.log('Auth data cleared');
};

const checkTokenFormat = (token) => {
  if (!token) return false;
  return token.split('.').length === 3;
};

const globalTokenCleanup = () => {
  console.log('=== GLOBAL TOKEN CLEANUP START ===');

  const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
  const userStr = localStorage.getItem(AUTH_CONFIG.USER_KEY);
  const refreshToken = localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);

  console.log('Before cleanup:', {
    hasToken: !!token,
    hasUser: !!userStr,
    hasRefreshToken: !!refreshToken,
    tokenLength: token?.length || 0,
    tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
  });

  const isValidToken = checkTokenFormat(token);

  if (token && !isValidToken) {
    console.log('Invalid token detected, clearing all auth data');
    clearAuthData();

    setTimeout(() => {
      const afterToken = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
      const afterUser = localStorage.getItem(AUTH_CONFIG.USER_KEY);
      const afterRefresh = localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);

      console.log('After cleanup:', {
        hasToken: !!afterToken,
        hasUser: !!afterUser,
        hasRefreshToken: !!afterRefresh,
      });
      console.log('=== GLOBAL TOKEN CLEANUP END ===');
    }, 10);
  } else if (isValidToken) {
    console.log('Valid token found, no cleanup needed');
    console.log('=== GLOBAL TOKEN CLEANUP END ===');
  } else {
    console.log('No token found, no cleanup needed');
    console.log('=== GLOBAL TOKEN CLEANUP END ===');
  }
};

const testDemoLogin = async () => {
  try {
    console.log('Testing demo login...');
    const response = await fetch('http://localhost:5001/api/auth/demo-login/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Demo login successful:', data);

      // Store the tokens
      if (data.token) {
        localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, data.token);
      }
      if (data.refresh_token) {
        localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, data.refresh_token);
      }
      if (data.user) {
        localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(data.user));
      }

      return data;
    } else {
      console.error('Demo login failed:', response.status, response.statusText);
      return null;
    }
  } catch (error) {
    console.error('Demo login error:', error);
    return null;
  }
};

const testCorsPreflight = async (universeId = 1) => {
  try {
    console.log(`Testing CORS preflight for universe endpoint (ID: ${universeId})...`);
    const response = await fetch(`http://localhost:5001/api/universes/${universeId}/`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5174',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Authorization',
      },
    });

    console.log('CORS preflight response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
    });

    return response.ok;
  } catch (error) {
    console.error('CORS preflight error:', error);
    return false;
  }
};

const testUniverseRequest = async (universeId = 1) => {
  try {
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    console.log(
      'Testing universe request with token:',
      token ? `${token.substring(0, 20)}...` : 'none'
    );

    const response = await fetch(`http://localhost:5001/api/universes/${universeId}/`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Universe request result:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Universe data:', data);
    }

    return response.ok;
  } catch (error) {
    console.error('Universe request error:', error);
    return false;
  }
};

const debugAuthFlow = async (universeId = 1) => {
  console.log('=== DEBUG AUTH FLOW START ===');

  // Step 1: Clear all auth data
  console.log('Step 1: Clearing all auth data...');
  clearAuthData();

  // Step 2: Check initial state
  console.log('Step 2: Checking initial state...');
  const initialToken = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
  const initialUser = localStorage.getItem(AUTH_CONFIG.USER_KEY);
  console.log('Initial state:', {
    hasToken: !!initialToken,
    hasUser: !!initialUser,
    token: initialToken,
    user: initialUser,
  });

  // Step 3: Test demo login
  console.log('Step 3: Testing demo login...');
  const demoResult = await testDemoLogin();

  // Step 4: Check state after demo login
  console.log('Step 4: Checking state after demo login...');
  const afterToken = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
  const afterUser = localStorage.getItem(AUTH_CONFIG.USER_KEY);
  console.log('After demo login:', {
    hasToken: !!afterToken,
    hasUser: !!afterUser,
    tokenLength: afterToken?.length || 0,
    tokenPreview: afterToken ? `${afterToken.substring(0, 20)}...` : 'none',
    user: afterUser ? JSON.parse(afterUser) : null,
  });

  // Step 5: Test CORS preflight
  console.log('Step 5: Testing CORS preflight...');
  const corsResult = await testCorsPreflight(universeId);

  // Step 6: Test universe request
  console.log('Step 6: Testing universe request...');
  const universeResult = await testUniverseRequest(universeId);

  console.log('=== DEBUG AUTH FLOW END ===');
  console.log('Results:', {
    demoLogin: !!demoResult,
    corsPreflight: corsResult,
    universeRequest: universeResult,
  });

  return { demoResult, corsResult, universeResult };
};

// Export functions for use in browser console
if (typeof window !== 'undefined') {
  window.testAuthFlow = {
    globalTokenCleanup,
    testDemoLogin,
    testCorsPreflight,
    testUniverseRequest,
    debugAuthFlow,
    clearAuthData,
  };

  console.log('Auth flow test functions available:');
  console.log('- window.testAuthFlow.globalTokenCleanup()');
  console.log('- window.testAuthFlow.testDemoLogin()');
  console.log('- window.testAuthFlow.testCorsPreflight()');
  console.log('- window.testAuthFlow.testUniverseRequest()');
  console.log('- window.testAuthFlow.debugAuthFlow()');
  console.log('- window.testAuthFlow.clearAuthData()');
}

export {
  clearAuthData,
  debugAuthFlow,
  globalTokenCleanup,
  testCorsPreflight,
  testDemoLogin,
  testUniverseRequest,
};
