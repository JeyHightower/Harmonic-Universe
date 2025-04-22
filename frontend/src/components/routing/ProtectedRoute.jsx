import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { Suspense, useTransition, useState, useEffect } from 'react';
import { AUTH_CONFIG, ROUTES } from '../../utils';
import { useDispatch } from 'react-redux';
import { demoLogin } from '../../store/slices/authSlice.mjs';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth);
  const location = useLocation();
  const [isPending, startTransition] = useTransition();
  const [content, setContent] = useState(null);
  const dispatch = useDispatch();

  // Get tokens directly from localStorage for comparison
  const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
  const hasAccessToken = !!token;
  const hasRefreshToken = !!localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
  const hasStoredUser = !!localStorage.getItem(AUTH_CONFIG.USER_KEY);
  const isDemoToken = token && (token.startsWith('demo-') || token.includes('demo'));

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
    isDemoToken,
  });

  // If we have a demo token but aren't authenticated, try to auto-login as demo
  useEffect(() => {
    if (!isAuthenticated && !loading && isDemoToken) {
      console.log('Demo token found but not authenticated, trying demo login');
      dispatch(demoLogin());
    }
  }, [isAuthenticated, isDemoToken, loading, dispatch]);

  // Update content with startTransition when authentication state changes
  useEffect(() => {
    if (!loading && isAuthenticated) {
      startTransition(() => {
        setContent(children);
      });
    }
  }, [loading, isAuthenticated, children]);

  // If still loading, show loading state
  if (loading) {
    console.debug('Auth state is loading, showing loading state');
    return <div>Loading...</div>;
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
}

export default ProtectedRoute;
