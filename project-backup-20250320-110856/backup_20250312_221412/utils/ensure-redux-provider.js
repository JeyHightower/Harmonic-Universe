/**
 * Ensures Redux Provider is available and properly configured
 */
(function () {
    // Create a minimal store if Redux is not available
    if (!window.Redux) {
        console.warn('[Redux Fix] Redux not found, creating minimal store');
        window.Redux = {
            createStore: function (reducer) {
                let state = reducer(undefined, { type: '@@redux/INIT' });
                const listeners = [];

                return {
                    getState: function () { return state; },
                    dispatch: function (action) {
                        state = reducer(state, action);
                        listeners.forEach(listener => listener());
                        return action;
                    },
                    subscribe: function (listener) {
                        listeners.push(listener);
                        return function () {
                            const index = listeners.indexOf(listener);
                            if (index > -1) listeners.splice(index, 1);
                        };
                    }
                };
            }
        };
    }

    // Create minimal Provider if React-Redux is not available
    if (!window.ReactRedux) {
        console.warn('[Redux Fix] React-Redux not found, creating minimal Provider');
        window.ReactRedux = {
            Provider: function (props) {
                console.warn('[Redux Fix] Using minimal Provider');
                return props.children;
            },
            connect: function () {
                return function (Component) {
                    return function (props) {
                        console.warn('[Redux Fix] Using minimal connected component');
                        return React.createElement(Component, props);
                    };
                };
            }
        };
    }

    // Patch Provider to handle common errors
    const originalProvider = window.ReactRedux.Provider;
    window.ReactRedux.Provider = function (props) {
        try {
            if (!props.store) {
                console.error('[Redux Fix] No store provided to Provider');
                return props.children;
            }
            return React.createElement(originalProvider, props);
        } catch (error) {
            console.error('[Redux Fix] Provider error:', error);
            return props.children;
        }
    };

    console.log('[Redux Fix] Redux Provider fixes applied');
})();
