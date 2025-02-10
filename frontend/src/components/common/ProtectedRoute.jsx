import LoadingSpinner from '@/components/common/LoadingSpinner';
import { logoutUserAsync, refreshToken } from '@/store/slices/authSlice';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { isAuthenticated, loading, token, refreshToken: refresh } = useSelector((state) => state.auth);
  const [isChecking, setIsChecking] = useState(true);
  const [checkCount, setCheckCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        // Prevent infinite loops by limiting check attempts
        if (checkCount >= 3) {
          console.error('Max auth check attempts reached');
          dispatch(logoutUserAsync());
          setIsChecking(false);
          return;
        }

        // Only attempt refresh if we have both tokens and aren't authenticated
        if (!isAuthenticated && refresh && token) {
          console.log('Attempting to refresh token...');
          setCheckCount(prev => prev + 1);
          await dispatch(refreshToken()).unwrap();
        } else if (!isAuthenticated && (!refresh || !token)) {
          // If we don't have both tokens, clear everything
          console.log('Missing tokens, clearing auth state...');
          dispatch(logoutUserAsync());
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        dispatch(logoutUserAsync());
      } finally {
        if (mounted) {
          setIsChecking(false);
        }
      }
    };

    // Only run auth check if we're not already authenticated
    if (!isAuthenticated) {
      checkAuth();
    } else {
      setIsChecking(false);
    }

    // Cleanup function
    return () => {
      mounted = false;
    };
  }, [dispatch, isAuthenticated, refresh, token, checkCount]);

  // Show loading spinner while checking authentication or during other loading states
  if (loading || isChecking) {
    return <LoadingSpinner />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login from:', location.pathname);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If we get here, we're authenticated and ready to render
  return children;
};

export default ProtectedRoute;
