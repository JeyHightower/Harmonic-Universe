import {
  clearAlert,
  hideConfirmDialog,
  setLoading,
  setSidebarOpen,
  setTheme,
  showAlert,
  showConfirmDialog,
  toggleSidebar,
  toggleTheme,
} from '@/store/slices/uiSlice';
import { AlertMessage, ConfirmDialog } from '@/types/ui';
import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './useRedux';

export const useUI = () => {
  const dispatch = useAppDispatch();
  const {
    theme,
    sidebarOpen,
    alert,
    confirmDialog,
    isLoading,
    loadingMessage,
  } = useAppSelector(state => state.ui);

  const handleToggleTheme = useCallback(() => {
    dispatch(toggleTheme());
  }, [dispatch]);

  const handleSetTheme = useCallback(
    (theme: 'light' | 'dark') => {
      dispatch(setTheme(theme));
    },
    [dispatch]
  );

  const handleToggleSidebar = useCallback(() => {
    dispatch(toggleSidebar());
  }, [dispatch]);

  const handleSetSidebarOpen = useCallback(
    (isOpen: boolean) => {
      dispatch(setSidebarOpen(isOpen));
    },
    [dispatch]
  );

  const handleShowAlert = useCallback(
    (alert: AlertMessage) => {
      dispatch(showAlert(alert));
      // Auto-hide alert after 5 seconds
      setTimeout(() => {
        dispatch(clearAlert());
      }, 5000);
    },
    [dispatch]
  );

  const handleClearAlert = useCallback(() => {
    dispatch(clearAlert());
  }, [dispatch]);

  const handleShowConfirmDialog = useCallback(
    (dialog: Omit<ConfirmDialog, 'isOpen'>) => {
      dispatch(showConfirmDialog(dialog));
    },
    [dispatch]
  );

  const handleHideConfirmDialog = useCallback(() => {
    dispatch(hideConfirmDialog());
  }, [dispatch]);

  const handleSetLoading = useCallback(
    (isLoading: boolean, message?: string) => {
      dispatch(setLoading({ isLoading, message }));
    },
    [dispatch]
  );

  return {
    theme,
    sidebarOpen,
    alert,
    confirmDialog,
    isLoading,
    loadingMessage,
    handleToggleTheme,
    handleSetTheme,
    handleToggleSidebar,
    handleSetSidebarOpen,
    handleShowAlert,
    handleClearAlert,
    handleShowConfirmDialog,
    handleHideConfirmDialog,
    handleSetLoading,
  };
};

export default useUI;
