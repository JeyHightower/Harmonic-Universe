/**
 * React JSX Runtime Polyfill
 * 
 * This file provides fallback implementations of JSX runtime functions
 * when the normal imports from React fail during build or runtime.
 */

// Simple implementation of JSX transform functions
export function jsx(type, props, key) {
  return {
    $$typeof: Symbol.for('react.element'),
    type,
    props,
    key: key === undefined ? null : key,
  };
}

export function jsxs(type, props, key) {
  return jsx(type, props, key);
}

export const Fragment = Symbol.for('react.fragment');

export const jsxDEV = jsx;

// Default export for ESM compatibility
export default {
  jsx,
  jsxs,
  jsxDEV,
  Fragment
};

// Install polyfill into global scope if needed
if (typeof window !== 'undefined') {
  // Ensure React exists
  window.React = window.React || {};

  // Add JSX runtime functions to React if they don't exist
  window.React.jsx = window.React.jsx || jsx;
  window.React.jsxs = window.React.jsxs || jsxs;
  window.React.Fragment = window.React.Fragment || Fragment;

  console.log('JSX Runtime Polyfill installed');
} 