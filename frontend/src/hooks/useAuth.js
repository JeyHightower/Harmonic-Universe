import {
  closeAuthModal,
  login,
  logout,
  openAuthModal,
  register,
  setAuthModalView,
} from '@/store/slices/authSlice';
import { showAlert } from '@/store/slices/uiSlice';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './useRedux';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    showAuthModal,
    authModalView,
  } = useAppSelector(state => state.auth);

  const handleLogin = useCallback(
    async credentials => {
      try {
        await dispatch(login(credentials)).unwrap();
        dispatch(closeAuthModal());
        dispatch(
          showAlert({
            type: 'success',
            message: 'Successfully logged in!',
          })
        );
      } catch (error) {
        // Error is handled by the auth slice and displayed in the form
      }
    },
    [dispatch]
  );

  const handleRegister = useCallback(
    async userData => {
      try {
        await dispatch(register(userData)).unwrap();
        dispatch(closeAuthModal());
        dispatch(
          showAlert({
            type: 'success',
            message: 'Successfully registered! Welcome aboard!',
          })
        );
      } catch (error) {
        // Error is handled by the auth slice and displayed in the form
      }
    },
    [dispatch]
  );

  const handleLogout = useCallback(async () => {
    try {
      await dispatch(logout()).unwrap();
      navigate('/');
      dispatch(
        showAlert({
          type: 'success',
          message: 'Successfully logged out!',
        })
      );
    } catch (error) {
      // Error is handled by the auth slice
    }
  }, [dispatch, navigate]);

  const handleOpenAuthModal = useCallback(
    (view = 'login') => {
      dispatch(openAuthModal(view));
    },
    [dispatch]
  );

  const handleCloseAuthModal = useCallback(() => {
    dispatch(closeAuthModal());
  }, [dispatch]);

  const handleSwitchAuthView = useCallback(
    view => {
      dispatch(setAuthModalView(view));
    },
    [dispatch]
  );

  const requireAuth = useCallback(
    callback => {
      if (!isAuthenticated) {
        dispatch(openAuthModal('login'));
        return;
      }
      callback();
    },
    [dispatch, isAuthenticated]
  );

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    showAuthModal,
    authModalView,
    handleLogin,
    handleRegister,
    handleLogout,
    handleOpenAuthModal,
    handleCloseAuthModal,
    handleSwitchAuthView,
    requireAuth,
  };
};

export default useAuth;
