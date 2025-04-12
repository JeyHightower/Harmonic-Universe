/**
 * User Service
 * Handles operations related to user profiles and account management
 */

import Logger from "../utils/logger";
import { httpClient } from './http-client';
import { userEndpoints } from './endpoints';
import { responseHandler } from './response-handler';

/**
 * Get the current user's profile
 * @returns {Promise<object>} - User profile data
 */
export const getProfile = async () => {
  try {
    const response = await httpClient.get(userEndpoints.profile);
    return responseHandler.handleSuccess(response);
  } catch (error) {
    log('user', 'Error fetching user profile', { error: error.message });
    return responseHandler.handleError(error);
  }
};

/**
 * Update the current user's profile
 * @param {object} profileData - Updated profile data
 * @returns {Promise<object>} - Updated user profile
 */
export const updateProfile = async (profileData) => {
  try {
    if (!profileData) {
      return responseHandler.handleError(new Error('Profile data is required'));
    }

    const response = await httpClient.put(userEndpoints.profile, profileData);
    
    log('user', 'User profile updated successfully');
    return responseHandler.handleSuccess(response);
  } catch (error) {
    log('user', 'Error updating user profile', { error: error.message });
    return responseHandler.handleError(error);
  }
};

/**
 * Change the current user's password
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<object>} - Password change response
 */
export const changePassword = async (currentPassword, newPassword) => {
  try {
    if (!currentPassword) {
      return responseHandler.handleError(new Error('Current password is required'));
    }
    
    if (!newPassword) {
      return responseHandler.handleError(new Error('New password is required'));
    }

    const response = await httpClient.post(userEndpoints.changePassword, {
      current_password: currentPassword,
      new_password: newPassword
    });
    
    log('user', 'Password changed successfully');
    return responseHandler.handleSuccess(response);
  } catch (error) {
    log('user', 'Error changing password', { error: error.message });
    return responseHandler.handleError(error);
  }
};

/**
 * Delete the current user's account
 * @param {string} password - User's password for confirmation
 * @returns {Promise<object>} - Account deletion response
 */
export const deleteAccount = async (password) => {
  try {
    if (!password) {
      return responseHandler.handleError(new Error('Password is required for account deletion'));
    }

    const response = await httpClient.post(userEndpoints.deleteAccount, { password });
    
    log('user', 'Account deleted successfully');
    return responseHandler.handleSuccess(response);
  } catch (error) {
    log('user', 'Error deleting account', { error: error.message });
    return responseHandler.handleError(error);
  }
};

/**
 * Get user preferences
 * @returns {Promise<object>} - User preferences
 */
export const getPreferences = async () => {
  try {
    const response = await httpClient.get(userEndpoints.preferences);
    return responseHandler.handleSuccess(response);
  } catch (error) {
    log('user', 'Error fetching user preferences', { error: error.message });
    return responseHandler.handleError(error);
  }
};

/**
 * Update user preferences
 * @param {object} preferences - Updated preferences
 * @returns {Promise<object>} - Updated preferences
 */
export const updatePreferences = async (preferences) => {
  try {
    if (!preferences) {
      return responseHandler.handleError(new Error('Preferences data is required'));
    }

    const response = await httpClient.put(userEndpoints.preferences, preferences);
    
    log('user', 'User preferences updated successfully');
    return responseHandler.handleSuccess(response);
  } catch (error) {
    log('user', 'Error updating user preferences', { error: error.message });
    return responseHandler.handleError(error);
  }
};

/**
 * User service object
 */
export const userService = {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  getPreferences,
  updatePreferences
};

export default userService;
