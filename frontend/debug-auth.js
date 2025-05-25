// Debug authentication state script
// Run this in the browser console to check the current auth state

function debugAuthState() {
  console.log('=== Authentication State Debug ===');

  // Get all auth-related localStorage items
  const token = localStorage.getItem('harmonic_universe_token');
  const refreshToken = localStorage.getItem('harmonic_universe_refresh_token');
  const user = localStorage.getItem('harmonic_universe_user');

  console.log('localStorage contents:');
  console.log('- token:', token ? `${token.substring(0, 20)}...` : 'none');
  console.log('- refreshToken:', refreshToken ? `${refreshToken.substring(0, 20)}...` : 'none');
  console.log('- user:', user ? JSON.parse(user) : 'none');

  // Check if token is JWT and decode it
  if (token) {
    try {
      const parts = token.split('.');
      console.log('\nToken analysis:');
      console.log('- Is JWT format:', parts.length === 3);

      if (parts.length === 3) {
        const header = JSON.parse(atob(parts[0]));
        const payload = JSON.parse(atob(parts[1]));

        console.log('- Header:', header);
        console.log('- Payload:', payload);
        console.log(
          '- Is demo token:',
          payload.sub &&
            (payload.sub.includes('demo-') ||
              payload.sub.includes('demo_') ||
              payload.sub === 'demo-user')
        );

        if (payload.exp) {
          const expiry = new Date(payload.exp * 1000);
          const now = new Date();
          console.log('- Expires:', expiry.toISOString());
          console.log('- Is expired:', now > expiry);
        }
      }
    } catch (e) {
      console.log('- Token parsing failed:', e.message);
      console.log('- Legacy demo check:', {
        startsWithDemo: token.startsWith('demo-'),
        includesDemoToken: token.includes('demo_token_'),
        includesDemoHyphen: token.includes('demo-token-'),
      });
    }
  }

  // Check refresh token
  if (refreshToken) {
    try {
      const parts = refreshToken.split('.');
      console.log('\nRefresh token analysis:');
      console.log('- Is JWT format:', parts.length === 3);

      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        console.log('- Payload:', payload);

        if (payload.exp) {
          const expiry = new Date(payload.exp * 1000);
          const now = new Date();
          console.log('- Expires:', expiry.toISOString());
          console.log('- Is expired:', now > expiry);
        }
      }
    } catch (e) {
      console.log('- Refresh token parsing failed:', e.message);
    }
  }

  console.log('\n=== End Debug ===');
}

// Auto-run the debug
debugAuthState();

// Also make it available globally
window.debugAuthState = debugAuthState;

console.log('Debug script loaded. Run debugAuthState() in console to re-check auth state.');
