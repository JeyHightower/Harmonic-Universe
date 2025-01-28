import { showAlert } from '@/store/slices/uiSlice';
import {
  clearSearchResults,
  clearUserProfile,
  clearUserSettings,
  fetchUserProfile,
  fetchUserSettings,
  searchUsers,
  updatePassword,
  updateUserProfile,
  updateUserSettings,
} from '@/store/slices/userSlice';
import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './useRedux';

export const useUser = () => {
  const dispatch = useAppDispatch();
  const { profile, settings, searchResults, isLoading, error } = useAppSelector(
    state => state.user
  );

  const handleFetchUserProfile = useCallback(
    async userId => {
      try {
        await dispatch(fetchUserProfile(userId)).unwrap();
      } catch (error) {
        // Error is handled by the user slice
      }
    },
    [dispatch]
  );

  const handleUpdateUserProfile = useCallback(
    async profileData => {
      try {
        await dispatch(updateUserProfile(profileData)).unwrap();
        dispatch(
          showAlert({
            type: 'success',
            message: 'Profile updated successfully!',
          })
        );
      } catch (error) {
        // Error is handled by the user slice
      }
    },
    [dispatch]
  );

  const handleFetchUserSettings = useCallback(async () => {
    try {
      await dispatch(fetchUserSettings()).unwrap();
    } catch (error) {
      // Error is handled by the user slice
    }
  }, [dispatch]);

  const handleUpdateUserSettings = useCallback(
    async settingsData => {
      try {
        await dispatch(updateUserSettings(settingsData)).unwrap();
        dispatch(
          showAlert({
            type: 'success',
            message: 'Settings updated successfully!',
          })
        );
      } catch (error) {
        // Error is handled by the user slice
      }
    },
    [dispatch]
  );

  const handleUpdatePassword = useCallback(
    async (currentPassword, newPassword) => {
      try {
        await dispatch(
          updatePassword({ currentPassword, newPassword })
        ).unwrap();
        dispatch(
          showAlert({
            type: 'success',
            message: 'Password updated successfully!',
          })
        );
      } catch (error) {
        // Error is handled by the user slice
      }
    },
    [dispatch]
  );

  const handleSearchUsers = useCallback(
    async query => {
      try {
        await dispatch(searchUsers(query)).unwrap();
      } catch (error) {
        // Error is handled by the user slice
      }
    },
    [dispatch]
  );

  const handleClearUserProfile = useCallback(() => {
    dispatch(clearUserProfile());
  }, [dispatch]);

  const handleClearUserSettings = useCallback(() => {
    dispatch(clearUserSettings());
  }, [dispatch]);

  const handleClearSearchResults = useCallback(() => {
    dispatch(clearSearchResults());
  }, [dispatch]);

  return {
    profile,
    settings,
    searchResults,
    isLoading,
    error,
    handleFetchUserProfile,
    handleUpdateUserProfile,
    handleFetchUserSettings,
    handleUpdateUserSettings,
    handleUpdatePassword,
    handleSearchUsers,
    handleClearUserProfile,
    handleClearUserSettings,
    handleClearSearchResults,
  };
};
