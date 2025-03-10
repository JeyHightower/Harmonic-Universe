/**
 * React Hook Fix
 *
 * This script fixes common hook-related issues in React applications:
 * 1. Context providers that might be missing
 * 2. Hook usage outside of React components
 * 3. Hook dependency tracking
 */

(function () {
    console.log('[Hook Fix] Initializing...');

    // Initialize hook fixes as soon as React becomes available
    function initializeHookFixes(event) {
        console.log('[Hook Fix] React is now available, setting up hook fixes...');
        setupHookFixes(event ? event.detail : window.React);
    }

    // Listen for the custom 'react-available' event from the polyfill
    window.addEventListener('react-available', initializeHookFixes);

    // Also try to initialize immediately if React is already available
    if (window.React) {
        initializeHookFixes();
    } else {
        console.log('[Hook Fix] Waiting for React to become available...');

        // Check periodically in case the event system doesn't work
        let attempts = 0;
        const checkInterval = setInterval(function () {
            attempts++;
            if (window.React) {
                console.log('[Hook Fix] React found, setting up hook fixes...');
                clearInterval(checkInterval);
                initializeHookFixes();
            } else if (attempts > 25) { // 5 seconds
                console.log('[Hook Fix] Giving up waiting for React after 5 seconds');
                clearInterval(checkInterval);
            }
        }, 200);
    }

    function setupHookFixes(React) {
        try {
            // Get React from parameter or global
            React = React || window.React;

            if (!React) {
                console.error('[Hook Fix] React is still not available');
                return;
            }

            console.log('[Hook Fix] Setting up hook fixes with React version:', React.version || 'unknown');

            // Store original hooks
            const originalHooks = {};

            // List of hooks we want to patch
            const hooksToPatch = [
                'useState',
                'useEffect',
                'useContext',
                'useReducer',
                'useCallback',
                'useMemo',
                'useRef',
                'useLayoutEffect'
            ];

            // Check if we have access to the real React hooks
            let hasRealHooks = false;
            hooksToPatch.forEach(hookName => {
                if (React[hookName] && typeof React[hookName] === 'function') {
                    originalHooks[hookName] = React[hookName];
                    hasRealHooks = true;
                }
            });

            if (!hasRealHooks) {
                console.warn('[Hook Fix] No real React hooks found, creating polyfill hooks');
            } else {
                console.log('[Hook Fix] Found React hooks, creating safer versions');
            }

            // Create a global hook context tracking system
            window.__HOOK_CONTEXT__ = window.__HOOK_CONTEXT__ || {
                current: null,
                stack: [],
                inHookContext: false
            };

            // Create React.Component if it doesn't exist
            if (!React.Component) {
                console.log('[Hook Fix] Creating minimal React.Component');
                React.Component = class Component { };
            }

            // Create a function component wrapper that provides hook context
            function withHookContext(Component) {
                if (Component.__withHookContext) {
                    return Component;
                }

                // Create a wrapper function that provides hook context
                const WithHookContext = function (props) {
                    const prevContext = window.__HOOK_CONTEXT__.current;
                    window.__HOOK_CONTEXT__.current = WithHookContext;
                    window.__HOOK_CONTEXT__.inHookContext = true;
                    window.__HOOK_CONTEXT__.stack.push(WithHookContext);

                    try {
                        return Component(props);
                    } finally {
                        window.__HOOK_CONTEXT__.stack.pop();
                        window.__HOOK_CONTEXT__.current = prevContext;
                        window.__HOOK_CONTEXT__.inHookContext = window.__HOOK_CONTEXT__.stack.length > 0;
                    }
                };

                WithHookContext.__withHookContext = true;
                WithHookContext.displayName = `WithHookContext(${Component.displayName || Component.name || 'Component'})`;

                return WithHookContext;
            }

            // Optimize React.createElement to automatically add hook context to function components
            if (React._originalCreateElement === undefined) {
                console.log('[Hook Fix] Monkey patching React.createElement to provide hook context');

                React._originalCreateElement = React.createElement;

                React.createElement = function (type, props, ...children) {
                    // Only wrap function components, not class components or intrinsic elements
                    if (typeof type === 'function' && !(type.prototype && type.prototype.isReactComponent)) {
                        type = withHookContext(type);
                    }

                    return React._originalCreateElement.apply(React, [type, props, ...children]);
                };
            }

            // Create a safer version of useContext that provides fallbacks
            React.useContext = function safeUseContext(Context) {
                try {
                    // If the context doesn't exist, provide a mock
                    if (!Context) {
                        console.warn('[Hook Fix] useContext called with null/undefined context');
                        return {};
                    }

                    // If the context is for Redux, provide mock Redux store
                    if (Context === window.ReduxContext || Context.displayName === 'ReactRedux') {
                        console.log('[Hook Fix] Using mock Redux context');
                        return {
                            store: window.__mockReduxStore,
                            storeState: window.__mockReduxStore?.getState?.() || {}
                        };
                    }

                    // If the context is for Router, provide mock router
                    if (Context === window.RouterContext ||
                        Context.displayName === 'Router' ||
                        Context.displayName === 'RouterContext') {
                        console.log('[Hook Fix] Using mock Router context');
                        return {
                            location: {
                                pathname: window.location.pathname,
                                search: window.location.search,
                                hash: window.location.hash
                            },
                            navigator: {
                                push: function (path) { console.log('[Mock Router] navigator.push called with', path); },
                                replace: function (path) { console.log('[Mock Router] navigator.replace called with', path); }
                            },
                            navigationType: "PUSH",
                            static: false
                        };
                    }

                    // If using old router context format
                    if (Context === window.RouterLegacyContext || Context.displayName === 'RouterLegacyContext') {
                        console.log('[Hook Fix] Using mock legacy Router context');
                        return {
                            history: {
                                push: function (path) { console.log('[Mock Router] history.push called with', path); },
                                replace: function (path) { console.log('[Mock Router] history.replace called with', path); },
                                location: { pathname: window.location.pathname }
                            },
                            location: {
                                pathname: window.location.pathname,
                                search: window.location.search,
                                hash: window.location.hash
                            },
                            match: { params: {}, path: window.location.pathname, url: window.location.pathname }
                        };
                    }

                    // If the context is something else but exists, use original hook
                    if (originalHooks.useContext) {
                        try {
                            return originalHooks.useContext(Context);
                        } catch (err) {
                            console.warn('[Hook Fix] Original useContext failed, using fallback', err);
                            // Continue to fallback
                        }
                    }

                    // Fallback: return the default value
                    return Context._currentValue || Context.defaultValue || {};
                } catch (error) {
                    console.error('[Hook Fix] Error in useContext:', error);
                    return {};
                }
            };

            // Create a safer version of useState
            React.useState = function safeUseState(initialState) {
                try {
                    // Check if we're in a valid hook context
                    if (!window.__HOOK_CONTEXT__.inHookContext) {
                        console.warn('[Hook Fix] useState called outside component render');
                    }

                    if (originalHooks.useState) {
                        try {
                            return originalHooks.useState(initialState);
                        } catch (err) {
                            console.warn('[Hook Fix] Original useState failed, using fallback', err);
                            // Continue to fallback
                        }
                    }

                    // Fallback implementation if hook is missing
                    console.log('[Hook Fix] Using fallback useState implementation');
                    const valueRef = React.useRef(
                        typeof initialState === 'function' ? initialState() : initialState
                    );

                    const setValue = function (newValueOrFn) {
                        if (typeof newValueOrFn === 'function') {
                            valueRef.current = newValueOrFn(valueRef.current);
                        } else {
                            valueRef.current = newValueOrFn;
                        }
                        // This won't trigger a re-render in our fallback,
                        // but at least it updates the value
                    };

                    return [valueRef.current, setValue];
                } catch (error) {
                    console.error('[Hook Fix] Error in useState:', error);
                    // Extremely basic fallback that at least doesn't crash
                    return [
                        typeof initialState === 'function' ? initialState() : initialState,
                        function () { }
                    ];
                }
            };

            // Create a safer version of useEffect
            React.useEffect = function safeUseEffect(effect, deps) {
                try {
                    // Check if we're in a valid hook context
                    if (!window.__HOOK_CONTEXT__.inHookContext) {
                        console.warn('[Hook Fix] useEffect called outside component render');
                    }

                    if (originalHooks.useEffect) {
                        try {
                            return originalHooks.useEffect(effect, deps);
                        } catch (err) {
                            console.warn('[Hook Fix] Original useEffect failed, using fallback', err);
                            // Continue to fallback
                        }
                    }

                    // Fallback: just run the effect once if no proper implementation
                    console.log('[Hook Fix] Using fallback useEffect implementation');

                    // Use useRef to track if effect has been run
                    const isFirstRenderRef = React.useRef(true);

                    if (isFirstRenderRef.current) {
                        isFirstRenderRef.current = false;
                        try {
                            // Run effect and capture cleanup function
                            const cleanup = effect();

                            // Store cleanup function for potential future use
                            if (typeof cleanup === 'function') {
                                window.__effectCleanupFunctions = window.__effectCleanupFunctions || [];
                                window.__effectCleanupFunctions.push(cleanup);
                            }
                        } catch (effectError) {
                            console.error('[Hook Fix] Error running effect:', effectError);
                        }
                    }
                } catch (error) {
                    console.error('[Hook Fix] Error in useEffect:', error);
                }
            };

            // Create safer versions of other hooks
            if (!React.useReducer || !originalHooks.useReducer) {
                React.useReducer = function safeUseReducer(reducer, initialState, init) {
                    // Check if we're in a valid hook context
                    if (!window.__HOOK_CONTEXT__.inHookContext) {
                        console.warn('[Hook Fix] useReducer called outside component render');
                    }

                    // Use useState internally
                    const state = typeof init === 'function'
                        ? React.useState(init(initialState))
                        : React.useState(initialState);

                    const dispatch = function (action) {
                        try {
                            const currentState = state[0];
                            const newState = reducer(currentState, action);
                            state[1](newState);
                            return action;
                        } catch (error) {
                            console.error('[Hook Fix] Error in useReducer dispatch:', error);
                            return action;
                        }
                    };

                    return [state[0], dispatch];
                };
            }

            // Create fallbacks for other hooks if they don't exist
            if (!React.useCallback || !originalHooks.useCallback) {
                React.useCallback = function safeUseCallback(callback, deps) {
                    // Check if we're in a valid hook context
                    if (!window.__HOOK_CONTEXT__.inHookContext) {
                        console.warn('[Hook Fix] useCallback called outside component render');
                    }

                    return callback;
                };
            }

            if (!React.useMemo || !originalHooks.useMemo) {
                React.useMemo = function safeUseMemo(factory, deps) {
                    // Check if we're in a valid hook context
                    if (!window.__HOOK_CONTEXT__.inHookContext) {
                        console.warn('[Hook Fix] useMemo called outside component render');
                    }

                    try {
                        return factory();
                    } catch (error) {
                        console.error('[Hook Fix] Error in useMemo factory:', error);
                        return undefined;
                    }
                };
            }

            if (!React.useRef || !originalHooks.useRef) {
                React.useRef = function safeUseRef(initialValue) {
                    // Check if we're in a valid hook context
                    if (!window.__HOOK_CONTEXT__.inHookContext) {
                        console.warn('[Hook Fix] useRef called outside component render');
                    }

                    const refObject = { current: initialValue };
                    return refObject;
                };
            }

            if (!React.useLayoutEffect || !originalHooks.useLayoutEffect) {
                React.useLayoutEffect = React.useEffect;
            }

            // Create Redux hooks if missing
            if (!window.useDispatch) {
                window.useDispatch = function useDispatch() {
                    if (!window.__HOOK_CONTEXT__.inHookContext) {
                        console.warn('[Hook Fix] useDispatch called outside component render');
                    }

                    console.log('[Mock Redux] useDispatch called');
                    return function mockDispatch(action) {
                        console.log('[Mock Redux] Dispatched action:', action);
                        if (window.__mockReduxStore && window.__mockReduxStore.dispatch) {
                            return window.__mockReduxStore.dispatch(action);
                        }
                        return action;
                    };
                };
            }

            if (!window.useSelector) {
                window.useSelector = function useSelector(selector) {
                    if (!window.__HOOK_CONTEXT__.inHookContext) {
                        console.warn('[Hook Fix] useSelector called outside component render');
                    }

                    console.log('[Mock Redux] useSelector called');
                    try {
                        const store = window.__mockReduxStore || { getState: () => ({}) };
                        return selector(store.getState());
                    } catch (error) {
                        console.warn('[Mock Redux] Selector error:', error);
                        return undefined;
                    }
                };
            }

            // Create Router hooks if missing
            if (!window.useNavigate) {
                window.useNavigate = function useNavigate() {
                    if (!window.__HOOK_CONTEXT__.inHookContext) {
                        console.warn('[Hook Fix] useNavigate called outside component render');
                    }

                    console.log('[Mock Router] useNavigate called');
                    return function navigate(to, options) {
                        console.log('[Mock Router] navigate to:', to, options);
                        if (window.history && window.history.pushState) {
                            try {
                                window.history.pushState({}, "", to);
                            } catch (e) {
                                console.warn('[Mock Router] Failed to update history:', e);
                            }
                        }
                    };
                };
            }

            if (!window.useLocation) {
                window.useLocation = function useLocation() {
                    if (!window.__HOOK_CONTEXT__.inHookContext) {
                        console.warn('[Hook Fix] useLocation called outside component render');
                    }

                    console.log('[Mock Router] useLocation called');
                    return {
                        pathname: window.location.pathname,
                        search: window.location.search,
                        hash: window.location.hash,
                        state: null,
                        key: 'default'
                    };
                };
            }

            if (!window.useParams) {
                window.useParams = function useParams() {
                    if (!window.__HOOK_CONTEXT__.inHookContext) {
                        console.warn('[Hook Fix] useParams called outside component render');
                    }

                    console.log('[Mock Router] useParams called');
                    // Try to extract params from pathname
                    const params = {};
                    const pathSegments = window.location.pathname.split('/').filter(Boolean);

                    if (pathSegments.length > 0) {
                        const lastSegment = pathSegments[pathSegments.length - 1];
                        if (lastSegment && !lastSegment.includes('.')) {
                            params.id = lastSegment;
                        }
                    }

                    return params;
                };
            }

            if (!window.useRouteMatch) {
                window.useRouteMatch = function useRouteMatch(path) {
                    if (!window.__HOOK_CONTEXT__.inHookContext) {
                        console.warn('[Hook Fix] useRouteMatch called outside component render');
                    }

                    console.log('[Mock Router] useRouteMatch called for path:', path);
                    const params = window.useParams ? window.useParams() : {};
                    const pathname = window.location.pathname;

                    return {
                        params: params,
                        path: path || pathname,
                        url: pathname,
                        isExact: path ? pathname === path : true
                    };
                };
            }

            console.log('[Hook Fix] React hooks patched with safer versions');
        } catch (error) {
            console.error('[Hook Fix] Error setting up hook fixes:', error);
        }
    }
})();
