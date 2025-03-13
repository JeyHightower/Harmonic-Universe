// React Fixes and Patches
import React from 'react';

// Fix for hook dependency tracking
export const createStableDependency = (value) => {
    const ref = React.useRef(value);
    React.useEffect(() => {
        ref.current = value;
    }, [value]);
    return ref.current;
};

// Fix for context provider updates
export const createStableProvider = (Context) => {
    return ({ children, value }) => {
        const stableValue = React.useMemo(() => value, Object.values(value));
        return React.createElement(Context.Provider, { value: stableValue }, children);
    };
};

// Fix for useEffect cleanup
export const useStableEffect = (effect, deps) => {
    const cleanup = React.useRef();
    React.useEffect(() => {
        if (cleanup.current) {
            cleanup.current();
        }
        cleanup.current = effect();
        return () => {
            if (cleanup.current) {
                cleanup.current();
            }
        };
    }, deps);
};

// Fix for state updates in unmounted components
export const useSafeState = (initialState) => {
    const mounted = React.useRef(false);
    const [state, setState] = React.useState(initialState);

    React.useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    const setSafeState = React.useCallback((value) => {
        if (mounted.current) {
            setState(value);
        }
    }, []);

    return [state, setSafeState];
};

// Fix for event handler memory leaks
export const createStableEventHandler = (handler) => {
    const handlerRef = React.useRef(handler);
    React.useEffect(() => {
        handlerRef.current = handler;
    }, [handler]);
    return React.useCallback((...args) => handlerRef.current(...args), []);
};

// Export all fixes
export const ReactFixes = {
    createStableDependency,
    createStableProvider,
    useStableEffect,
    useSafeState,
    createStableEventHandler
};
