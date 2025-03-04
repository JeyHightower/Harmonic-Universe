/**
 * This file is a compatibility shim for react-is that supports named imports
 * It handles differences between react-is v18 and v19
 *
 * IMPORTANT: This file uses a default export only approach.
 * Import the module with:
 *   import ReactIs from './react-is-shim';
 * Then use:
 *   ReactIs.ForwardRef, ReactIs.isForwardRef, ReactIs.isMemo
 */

// Import react-is but not directly access its exports during initialization
import * as ReactIsOriginal from 'react-is';
import React from 'react';

// Export named exports that rc-util expects
// Use a trick that doesn't access ReactIs during initialization
export const ForwardRef = Symbol.for('react.forward_ref');
export const isMemo = (obj) => {
    // Delegate to the actual implementation at runtime, avoiding initialization access
    return ReactIsOriginal.isMemo ? ReactIsOriginal.isMemo(obj) :
        ReactIsOriginal.typeOf && ReactIsOriginal.typeOf(obj) === Symbol.for('react.memo');
};
export const isForwardRef = (obj) => {
    // Delegate to the actual implementation at runtime, avoiding initialization access
    return ReactIsOriginal.isForwardRef ? ReactIsOriginal.isForwardRef(obj) :
        ReactIsOriginal.typeOf && ReactIsOriginal.typeOf(obj) === Symbol.for('react.forward_ref');
};
export const isValidElement = (obj) => {
    // Use React's isValidElement directly
    return React.isValidElement(obj);
};

// Create a proxy for other properties
const ReactIsProxy = new Proxy({}, {
    get(target, prop) {
        if (prop === 'ForwardRef') return ForwardRef;
        if (prop === 'isMemo') return isMemo;
        if (prop === 'isForwardRef') return isForwardRef;
        if (prop === 'isValidElement') return isValidElement;

        // For everything else, pass through to the original module
        return ReactIsOriginal[prop];
    }
});

// Export ONLY the proxy as default export
// No named exports to avoid circular references
export default ReactIsProxy;
