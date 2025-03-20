import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { ROUTES } from './index';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useSelector(state => state.auth);
  const location = useLocation();

  // If still loading, show loading state
  if (loading) {
    return <div>Loading...</div>;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // If authenticated, render children
  return children;
}

export default ProtectedRoute;
