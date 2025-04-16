/**
 * JSX Runtime Polyfill for Harmonic Universe
 * This file provides compatibility for React JSX runtime
 * It handles cases where React version mismatches occur
 */

console.log('JSX Runtime Polyfill installed');

// Check if React is already defined
const React = window.React || {};

// Create original backup if this is first load
if (!window.__ORIGINAL_REACT__ && window.React) {
  window.__ORIGINAL_REACT__ = { ...window.React };
}

// Helper for ref normalization
function normalizeRef(ref) {
  if (ref === null || ref === undefined) return null;
  if (typeof ref === 'function') return ref;
  if (typeof ref === 'object' && 'current' in ref) return ref;

  // Convert string refs (should not happen in modern React)
  if (typeof ref === 'string') {
    console.warn('String refs are deprecated and not supported.');
    return null;
  }

  return null;
}

// Safe createElement that handles refs properly
function safeCreateElement(type, config, ...children) {
  // Clone config to avoid modifying the original
  const props = { ...config };

  // Handle ref properly - this is the key fix for the ref errors
  if (props && props.ref !== undefined) {
    props.ref = normalizeRef(props.ref);
  }

  // Use original React.createElement if available, otherwise use our implementation
  if (React.createElement) {
    return React.createElement(type, props, ...children);
  }

  // Simple implementation as fallback
  return { type, props: { ...props, children } };
}

// JSX Runtime functions
export function jsx(type, props, key) {
  // Ensure props is always an object
  const safeProps = props || {};

  // Handle ref conversion
  if (safeProps.ref !== undefined) {
    safeProps.ref = normalizeRef(safeProps.ref);
  }

  // Set key if provided
  if (key !== undefined) {
    safeProps.key = key;
  }

  return safeCreateElement(type, safeProps);
}

export function jsxs(type, props, key) {
  // Use same implementation as jsx
  return jsx(type, props, key);
}

export const Fragment = React.Fragment || Symbol('Fragment');

// Default export for compatibility
export default {
  jsx,
  jsxs,
  Fragment
};

// Patch global React if needed
if (window.React && !window.React.__JSX_RUNTIME_PATCHED__) {
  const originalCreateElement = window.React.createElement;

  // Patch createElement to handle refs properly
  window.React.createElement = function patchedCreateElement(type, config, ...children) {
    // Clone config to avoid modifying the original
    const props = config ? { ...config } : {};

    // Handle ref properly
    if (props && props.ref !== undefined) {
      props.ref = normalizeRef(props.ref);
    }

    // Use original implementation
    return originalCreateElement(type, props, ...children);
  };

  // Mark as patched
  window.React.__JSX_RUNTIME_PATCHED__ = true;
}

// Add to window for direct access from other scripts
window.__JSX_RUNTIME = {
  jsx,
  jsxs,
  Fragment,
  normalizeRef
}; 