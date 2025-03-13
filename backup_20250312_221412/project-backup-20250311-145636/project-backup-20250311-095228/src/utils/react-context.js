// React Context Utilities
import React from 'react';
import { ReactFixes } from './react-fixes';

// Create a context with enhanced error handling
export const createSafeContext = (defaultValue, name = 'Unknown') => {
    const context = React.createContext(defaultValue);
    context.displayName = name;

    const useContext = () => {
        const value = React.useContext(context);
        if (value === undefined) {
            throw new Error(`use${name}Context must be used within a ${name}Provider`);
        }
        return value;
    };

    return { context, useContext };
};

// Create a context with state management
export const createStateContext = (initialState, name = 'State') => {
    const { context, useContext } = createSafeContext(undefined, name);

    const Provider = ({ children, initialValue = initialState }) => {
        const [state, setState] = ReactFixes.useSafeState(initialValue);

        const value = React.useMemo(() => ({
            state,
            setState
        }), [state]);

        return React.createElement(context.Provider, { value }, children);
    };

    return {
        Provider,
        useContext,
        context
    };
};

// Create a context with async state management
export const createAsyncContext = (asyncFn, name = 'Async') => {
    const { context, useContext } = createSafeContext(undefined, name);

    const Provider = ({ children }) => {
        const [state, setState] = ReactFixes.useSafeState({
            loading: false,
            error: null,
            data: null
        });

        const execute = React.useCallback(async (...args) => {
            setState({ loading: true, error: null, data: null });
            try {
                const data = await asyncFn(...args);
                setState({ loading: false, error: null, data });
                return data;
            } catch (error) {
                setState({ loading: false, error, data: null });
                throw error;
            }
        }, []);

        const value = React.useMemo(() => ({
            ...state,
            execute
        }), [state, execute]);

        return React.createElement(context.Provider, { value }, children);
    };

    return {
        Provider,
        useContext,
        context
    };
};

// Create a context with local storage persistence
export const createPersistentContext = (key, initialState, name = 'Persistent') => {
    const { context, useContext } = createSafeContext(undefined, name);

    const Provider = ({ children }) => {
        const [state, setState] = React.useState(() => {
            try {
                const item = window.localStorage.getItem(key);
                return item ? JSON.parse(item) : initialState;
            } catch (error) {
                console.error(`Error reading ${key} from localStorage:`, error);
                return initialState;
            }
        });

        React.useEffect(() => {
            try {
                window.localStorage.setItem(key, JSON.stringify(state));
            } catch (error) {
                console.error(`Error writing ${key} to localStorage:`, error);
            }
        }, [state]);

        const value = React.useMemo(() => ({
            state,
            setState
        }), [state]);

        return React.createElement(context.Provider, { value }, children);
    };

    return {
        Provider,
        useContext,
        context
    };
};

// Export all context utilities
export const ReactContext = {
    createSafeContext,
    createStateContext,
    createAsyncContext,
    createPersistentContext
};
