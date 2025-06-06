// Action types
export const AUTH_ACTION_TYPES = {
  LOGIN_START: 'auth/loginStart',
  LOGIN_SUCCESS: 'auth/loginSuccess',
  LOGIN_FAILURE: 'auth/loginFailure',
  LOGOUT: 'auth/logout',
  LOGOUT_SUCCESS: 'auth/logoutSuccess',
  LOGOUT_FAILURE: 'auth/logoutFailure',
  UPDATE_USER: 'auth/updateUser',
  CLEAR_ERROR: 'auth/clearError',
  SET_NETWORK_ERROR: 'auth/setNetworkError',
  SET_OFFLINE_MODE: 'auth/setOfflineMode',
  SET_LOGIN_REDIRECT: 'auth/setLoginRedirect',
};

// Action creators
export const loginStart = () => ({
  type: AUTH_ACTION_TYPES.LOGIN_START,
});

export const loginSuccess = (payload) => ({
  type: AUTH_ACTION_TYPES.LOGIN_SUCCESS,
  payload,
});

export const loginFailure = (error) => ({
  type: AUTH_ACTION_TYPES.LOGIN_FAILURE,
  payload: error,
});

export const logout = () => ({
  type: AUTH_ACTION_TYPES.LOGOUT,
});

export const logoutSuccess = () => ({
  type: AUTH_ACTION_TYPES.LOGOUT_SUCCESS,
});

export const logoutFailure = (error) => ({
  type: AUTH_ACTION_TYPES.LOGOUT_FAILURE,
  payload: error,
});

export const updateUser = (user) => ({
  type: AUTH_ACTION_TYPES.UPDATE_USER,
  payload: user,
});

export const clearError = () => ({
  type: AUTH_ACTION_TYPES.CLEAR_ERROR,
});

export const setNetworkError = (error) => ({
  type: AUTH_ACTION_TYPES.SET_NETWORK_ERROR,
  payload: error,
});

export const setOfflineMode = (isOffline) => ({
  type: AUTH_ACTION_TYPES.SET_OFFLINE_MODE,
  payload: isOffline,
});

export const setLoginRedirect = (path) => ({
  type: AUTH_ACTION_TYPES.SET_LOGIN_REDIRECT,
  payload: path,
});
