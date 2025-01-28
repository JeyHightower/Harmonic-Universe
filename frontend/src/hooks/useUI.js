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
    theme => {
      dispatch(setTheme(theme));
    },
    [dispatch]
  );

  const handleToggleSidebar = useCallback(() => {
    dispatch(toggleSidebar());
  }, [dispatch]);

  const handleSetSidebarOpen = useCallback(
    isOpen => {
      dispatch(setSidebarOpen(isOpen));
    },
    [dispatch]
  );

  const handleShowAlert = useCallback(
    alert => {
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
    dialog => {
      dispatch(showConfirmDialog(dialog));
    },
    [dispatch]
  );

  const handleHideConfirmDialog = useCallback(() => {
    dispatch(hideConfirmDialog());
  }, [dispatch]);

  const handleSetLoading = useCallback(
    (isLoading, message) => {
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
