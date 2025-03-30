import { useLocation, useNavigate } from "react-router-dom";

/**
 * Safe version of useLocation that ensures Router Provider is available
 * @returns {Object} The location object
 */
export const safeUseLocation = () => {
  try {
    return useLocation();
  } catch (error) {
    console.warn("Router Provider not available:", error);
    return { pathname: "/", search: "", hash: "", state: null };
  }
};

/**
 * Safe version of useNavigate that ensures Router Provider is available
 * @returns {Function} The navigate function
 */
export const safeUseNavigate = () => {
  try {
    return useNavigate();
  } catch (error) {
    console.warn("Router Provider not available:", error);
    return () => {};
  }
};

/**
 * Ensures Router Provider is available
 * @returns {boolean} Whether Router Provider is available
 */
export const ensureRouterProvider = () => {
  try {
    useLocation();
    return true;
  } catch (error) {
    console.warn("Router Provider not available:", error);
    return false;
  }
};
