import { useLocation, useNavigate } from "react-router-dom";
import React from "react";

/**
 * Safe version of useLocation that ensures Router Provider is available
 * @returns {Object} The location object
 */
export const useSafeLocation = () => {
  try {
    return useLocation();
  } catch (error) {
    console.warn("Router Provider not available:", error);
    return { pathname: "/", search: "", hash: "", state: null };
  }
};

// For backward compatibility
export const safeUseLocation = useSafeLocation;

/**
 * Safe version of useNavigate that ensures Router Provider is available
 * @returns {Function} The navigate function
 */
export const useSafeNavigate = () => {
  try {
    return useNavigate();
  } catch (error) {
    console.warn("Router Provider not available:", error);
    return () => {};
  }
};

// For backward compatibility
export const safeUseNavigate = useSafeNavigate;

/**
 * React hook to check if Router Provider is available
 * @returns {boolean} Whether Router Provider is available
 */
export const useRouterProvider = () => {
  try {
    // Just reference the hook to check if it throws
    useLocation();
    return true;
  } catch (error) {
    console.warn("Router Provider not available:", error);
    return false;
  }
};

// For backward compatibility
export const ensureRouterProvider = useRouterProvider;
