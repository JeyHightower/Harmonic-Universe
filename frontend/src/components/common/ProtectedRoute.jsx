import LoadingSpinner from '@/components/common/LoadingSpinner';
import { logoutUserAsync, refreshToken } from '@/store/slices/authSlice';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { isAuthenticated, loading, token } = useSelector((state) => state.auth);
  const [isChecking, setIsChecking] = useState(true);
  const [checkCount, setCheckCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    let timeoutId = null;

    const checkAuth = async () => {
      try {
        // Prevent infinite loops by limiting check attempts
        if (checkCount >= 3) {
          console.error('Max auth check attempts reached');
          dispatch(logoutUserAsync());
          setIsChecking(false);
          return;
        }

        // Only check if we're not authenticated and have a token
        if (!isAuthenticated && token) {
          console.log('Attempting to refresh token...');
          setCheckCount(prev => prev + 1);
          await dispatch(refreshToken()).unwrap();
        }

        if (mounted) {
          setIsChecking(false);
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        dispatch(logoutUserAsync());
        if (mounted) {
          setIsChecking(false);
        }
      }
    };

    // Add a small delay before checking auth to prevent rapid rechecks
    timeoutId = setTimeout(() => {
      if (!isAuthenticated && token) {
        checkAuth();
      } else {
        setIsChecking(false);
      }
    }, 100);

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [dispatch, isAuthenticated, token, checkCount]);

  // Show loading spinner while checking authentication or during other loading states
  if (loading || isChecking) {
    return <LoadingSpinner />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If we get here, we're authenticated and ready to render
  return children;
};

export default ProtectedRoute;
