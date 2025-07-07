import { Suspense, useEffect, useRef, useState, useTransition } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../../services/auth.service.mjs';
import { demoService } from '../../services/demo.service.mjs';
import { demoLogin } from '../../store/thunks/authThunks';
import { AUTH_CONFIG, ROUTES } from '../../utils';

const DEMO_LOGIN_FAILED_KEY = 'demo_login_failed';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user, loginInProgress } = useSelector((state) => state.auth);
  const location = useLocation();
  const [isPending, startTransition] = useTransition();
  const [content, setContent] = useState(null);
  const [demoLoginError, setDemoLoginError] = useState(false);
  const dispatch = useDispatch();
  const demoLoginInProgress = useRef(false);
  const demoLoginAttempted = useRef(false); // Track if we've already attempted demo login

  console.log('[ProtectedRoute] render', { isAuthenticated, loading, user, loginInProgress });

  // Get tokens directly from localStorage for comparison
  const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
  const hasAccessToken = !!token;
  const hasRefreshToken = !!localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
  const hasStoredUser = !!localStorage.getItem(AUTH_CONFIG.USER_KEY);
  const isDemoSession = demoService.isDemoSession();
  const tokenVerificationFailed = localStorage.getItem('token_verification_failed') === 'true';
  const demoLoginFailed = localStorage.getItem(DEMO_LOGIN_FAILED_KEY) === 'true';

  console.debug('ProtectedRoute check:', {
    isAuthenticated,
    loading,
    path: location.pathname,
    query: location.search,
    hasAccessToken,
    hasRefreshToken,
    hasStoredUser,
    hasUser: !!user,
    userId: user?.id,
    isDemoSession,
    tokenVerificationFailed,
    demoLoginFailed,
  });

  // Check token validity on mount and when token changes
  useEffect(() => {
    const validateToken = async () => {
      if (token && !isDemoSession) {
        try {
          const isValid = await authService.validateToken();
          if (!isValid) {
            console.warn('Token validation failed in ProtectedRoute');
            authService.clearAuthData();
            localStorage.setItem('token_verification_failed', 'true');
          }
        } catch (error) {
          console.error('Error validating token:', error);
          authService.clearAuthData();
          localStorage.setItem('token_verification_failed', 'true');
        }
      }
    };

    validateToken();
  }, [token, isDemoSession]);

  // If we have a demo session but aren't authenticated, try to auto-login as demo
  useEffect(() => {
    console.log('[ProtectedRoute] Demo login effect:', {
      isAuthenticated,
      loading,
      isDemoSession,
      demoLoginFailed,
      demoLoginInProgress: demoLoginInProgress.current,
    });

    // Only attempt demo login if:
    // 1. Not authenticated
    // 2. Not loading
    // 3. Is a demo session
    // 4. Demo login hasn't failed
    // 5. Demo login is not already in progress
    // 6. We haven't already attempted demo login
    // 7. We have a valid demo session (tokens exist)
    if (
      !isAuthenticated &&
      !loading &&
      isDemoSession &&
      !demoLoginFailed &&
      !demoLoginInProgress.current &&
      !demoLoginAttempted.current
    ) {
      // Additional check: ensure we have the required tokens
      const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
      const refreshToken = localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
      const userStr = localStorage.getItem(AUTH_CONFIG.USER_KEY);

      if (token && refreshToken && userStr) {
        console.log('[ProtectedRoute] Valid demo session detected, skipping demo login');
        return; // We already have a valid demo session, no need to login again
      }

      demoLoginInProgress.current = true;
      demoLoginAttempted.current = true; // Mark that we've attempted demo login
      console.log('[ProtectedRoute] Dispatching demoLogin');
      dispatch(demoLogin())
        .unwrap()
        .then(() => {
          localStorage.removeItem(DEMO_LOGIN_FAILED_KEY);
          setDemoLoginError(false);
          demoLoginInProgress.current = false;
        })
        .catch((err) => {
          console.error('Demo login failed in ProtectedRoute:', err);
          localStorage.setItem(DEMO_LOGIN_FAILED_KEY, 'true');
          setDemoLoginError(true);
          demoLoginInProgress.current = false;
        });
    }
  }, [isAuthenticated, isDemoSession, loading, dispatch, demoLoginFailed]);

  // Reset demo login attempt when auth state changes to authenticated
  useEffect(() => {
    if (isAuthenticated) {
      demoLoginAttempted.current = false;
      demoLoginInProgress.current = false;
    }
  }, [isAuthenticated]);

  // Update content with startTransition when authentication state changes
  useEffect(() => {
    if (!loading && isAuthenticated) {
      startTransition(() => {
        setContent(children);
      });
    }
  }, [loading, isAuthenticated, children, startTransition]);

  // If login is in progress, show loading spinner and block all logic
  if (loginInProgress) {
    return <div>Logging in...</div>;
  }

  // If still loading, show loading state
  if (loading) {
    console.debug('Auth state is loading, showing loading state');
    return <div>Loading...</div>;
  }

  // If demo login failed, show error and require user action to retry
  if (demoLoginFailed || demoLoginError) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'red' }}>
        <h2>Demo Login Failed</h2>
        <p>Unable to log in as demo user. This may be due to rate limiting or a network error.</p>
        <button
          onClick={() => {
            localStorage.removeItem(DEMO_LOGIN_FAILED_KEY);
            setDemoLoginError(false);
            window.location.reload();
          }}
        >
          Retry Demo Login
        </button>
      </div>
    );
  }

  // If token verification failed, redirect to login
  if (tokenVerificationFailed) {
    console.debug('Token verification failed, redirecting to login');
    authService.clearAuthData();
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    console.debug('User is not authenticated, redirecting to login');

    // Try to log more debug info
    try {
      const storedToken = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
      const storedUser = localStorage.getItem(AUTH_CONFIG.USER_KEY);
      console.debug('Auth failed details:', {
        tokenLength: storedToken ? storedToken.length : 0,
        userDataExists: !!storedUser,
        currentPath: location.pathname,
        searchParams: location.search,
      });
    } catch (e) {
      console.error('Error logging auth details:', e);
    }

    // Save the current location they're trying to access
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // If authenticated, render children with Suspense boundary to handle lazy loading
  console.debug('User is authenticated, rendering protected content');
  return (
    <Suspense fallback={<div>Loading content...</div>}>
      {isPending ? <div>Loading content...</div> : content}
    </Suspense>
  );
};

export default ProtectedRoute;
