/**
 * This is a complete replacement for react-is that avoids any recursive imports
 * It directly implements the necessary type checking functions using Symbol comparison
 *
 * IMPORTANT: This completely replaces the react-is module without importing it
 */

import React from 'react';

// Define React symbols directly
const ReactSymbols = {
    REACT_ELEMENT_TYPE: Symbol.for('react.element'),
    REACT_PORTAL_TYPE: Symbol.for('react.portal'),
    REACT_FRAGMENT_TYPE: Symbol.for('react.fragment'),
    REACT_STRICT_MODE_TYPE: Symbol.for('react.strict_mode'),
    REACT_PROFILER_TYPE: Symbol.for('react.profiler'),
    REACT_PROVIDER_TYPE: Symbol.for('react.provider'),
    REACT_CONTEXT_TYPE: Symbol.for('react.context'),
    REACT_SERVER_CONTEXT_TYPE: Symbol.for('react.server_context'),
    REACT_FORWARD_REF_TYPE: Symbol.for('react.forward_ref'),
    REACT_SUSPENSE_TYPE: Symbol.for('react.suspense'),
    REACT_SUSPENSE_LIST_TYPE: Symbol.for('react.suspense_list'),
    REACT_MEMO_TYPE: Symbol.for('react.memo'),
    REACT_LAZY_TYPE: Symbol.for('react.lazy')
};

// Direct implementation of type checking functions
function typeOf(object) {
    if (object === null || typeof object !== 'object') {
        return null;
    }
    return object.$$typeof || null;
}

// Type checking functions implemented directly without recursion
const isElement = (object) => {
    return typeof object === 'object' &&
        object !== null &&
        object.$$typeof === ReactSymbols.REACT_ELEMENT_TYPE;
};

const isValidElementType = (type) => {
    return typeof type === 'string' ||
        typeof type === 'function' ||
        type === ReactSymbols.REACT_FRAGMENT_TYPE ||
        type === ReactSymbols.REACT_PROFILER_TYPE ||
        type === ReactSymbols.REACT_STRICT_MODE_TYPE ||
        type === ReactSymbols.REACT_SUSPENSE_TYPE ||
        type === ReactSymbols.REACT_SUSPENSE_LIST_TYPE ||
        (typeof type === 'object' &&
            type !== null &&
            (type.$$typeof === ReactSymbols.REACT_LAZY_TYPE ||
                type.$$typeof === ReactSymbols.REACT_MEMO_TYPE ||
                type.$$typeof === ReactSymbols.REACT_PROVIDER_TYPE ||
                type.$$typeof === ReactSymbols.REACT_CONTEXT_TYPE ||
                type.$$typeof === ReactSymbols.REACT_FORWARD_REF_TYPE));
};

const isForwardRef = (object) => {
    return typeOf(object) === ReactSymbols.REACT_FORWARD_REF_TYPE;
};

const isFragment = (object) => {
    return typeOf(object) === ReactSymbols.REACT_FRAGMENT_TYPE;
};

const isLazy = (object) => {
    return typeOf(object) === ReactSymbols.REACT_LAZY_TYPE;
};

const isMemo = (object) => {
    return typeOf(object) === ReactSymbols.REACT_MEMO_TYPE;
};

const isPortal = (object) => {
    return typeOf(object) === ReactSymbols.REACT_PORTAL_TYPE;
};

const isProfiler = (object) => {
    return typeOf(object) === ReactSymbols.REACT_PROFILER_TYPE;
};

const isStrictMode = (object) => {
    return typeOf(object) === ReactSymbols.REACT_STRICT_MODE_TYPE;
};

const isSuspense = (object) => {
    return typeOf(object) === ReactSymbols.REACT_SUSPENSE_TYPE;
};

// Define isValidElement function
const isValidElement = (object) => {
    return React.isValidElement(object);
};

// Export both named constants and functions
const ReactIs = {
    // Type Symbols
    ForwardRef: ReactSymbols.REACT_FORWARD_REF_TYPE,
    Memo: ReactSymbols.REACT_MEMO_TYPE,
    Fragment: ReactSymbols.REACT_FRAGMENT_TYPE,
    Profiler: ReactSymbols.REACT_PROFILER_TYPE,
    Portal: ReactSymbols.REACT_PORTAL_TYPE,
    StrictMode: ReactSymbols.REACT_STRICT_MODE_TYPE,
    Suspense: ReactSymbols.REACT_SUSPENSE_TYPE,
    SuspenseList: ReactSymbols.REACT_SUSPENSE_LIST_TYPE,

    // Functions
    typeOf,
    isElement,
    isValidElementType,
    isForwardRef,
    isFragment,
    isLazy,
    isMemo,
    isPortal,
    isProfiler,
    isStrictMode,
    isSuspense,
    isValidElement
};

// Export named exports for destructuring
export const ForwardRef = ReactSymbols.REACT_FORWARD_REF_TYPE;
export const Memo = ReactSymbols.REACT_MEMO_TYPE;
export const Fragment = ReactSymbols.REACT_FRAGMENT_TYPE;
export { typeOf, isElement, isValidElementType, isForwardRef, isFragment, isLazy, isMemo, isPortal, isProfiler, isStrictMode, isSuspense, isValidElement };

// Default export for direct module usage
export default ReactIs;
