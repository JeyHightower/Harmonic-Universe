import { RootState } from '@store/index';
import { login, logout, register, validateToken } from '@store/slices/authSlice';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, token, isAuthenticated, loading, error } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    if (token && !user) {
      dispatch(validateToken());
    }
  }, [dispatch, token, user]);

  const handleLogin = async (email: string, password: string) => {
    try {
      await dispatch(login({ email, password })).unwrap();
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleRegister = async (email: string, password: string, username: string) => {
    try {
      await dispatch(register({ email, password, username })).unwrap();
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  return {
    user,
    isAuthenticated,
    loading,
    error,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
  };
};
