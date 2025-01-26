import store from "@/store";
import { logout, refreshToken } from "@/store/slices/authSlice";
import { showAlert } from "@/store/slices/uiSlice";
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth.accessToken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for handling token refresh and errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const state = store.getState();

    // Handle 401 errors (Unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the token
        const result = await store.dispatch(refreshToken()).unwrap();

        // If token refresh was successful, retry the original request
        if (result?.access_token) {
          originalRequest.headers.Authorization = `Bearer ${result.access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // If token refresh fails, log out the user
        store.dispatch(logout());
        store.dispatch(
          showAlert({
            type: "error",
            message: "Your session has expired. Please log in again.",
          }),
        );
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    const errorMessage =
      error.response?.data?.error ||
      error.message ||
      "An unexpected error occurred";

    store.dispatch(
      showAlert({
        type: "error",
        message: errorMessage,
      }),
    );

    return Promise.reject(error);
  },
);

export default api;
