import {
  clearError,
  login,
  logout,
  register,
  selectAuthError,
  selectAuthLoading,
  selectAuthState,
  selectToken,
  selectUser,
} from '@/store/slices/authSlice';
import { AppDispatch } from '@/store/store';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

export const useAuth = () => {
  const dispatch = useDispatch();
  const authState = useSelector(selectAuthState);
  const user = useSelector(selectUser);
  const token = useSelector(selectToken);
  const error = useSelector(selectAuthError);
  const loading = useSelector(selectAuthLoading);

  const handleLogin = useCallback(
    async (email: string, password: string) => {
      try {
        await dispatch(login({ email, password })).unwrap();
        return true;
      } catch (error) {
        return false;
      }
    },
    [dispatch]
  );

  const handleRegister = useCallback(
    async (username: string, email: string, password: string) => {
      try {
        await dispatch(register({ username, email, password })).unwrap();
        return true;
      } catch (error) {
        return false;
      }
    },
    [dispatch]
  );

  const handleLogout = useCallback(async () => {
    await dispatch(logout());
  }, [dispatch]);

  const handleClearError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    user,
    token,
    error,
    loading,
    isAuthenticated: !!token,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    clearError: handleClearError,
  };
};
