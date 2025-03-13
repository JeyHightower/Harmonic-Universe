/**
 * Ensures Router Provider is available and properly configured
 */
(function () {
    // Create minimal Router components if React Router is not available
    if (!window.ReactRouter) {
        console.warn('[Router Fix] React Router not found, creating minimal router');
        window.ReactRouter = {
            Router: function (props) {
                console.warn('[Router Fix] Using minimal Router');
                return props.children;
            },
            Route: function (props) {
                console.warn('[Router Fix] Using minimal Route');
                return props.children;
            },
            Switch: function (props) {
                console.warn('[Router Fix] Using minimal Switch');
                return props.children && props.children[0];
            },
            Link: function (props) {
                return React.createElement('a', {
                    href: props.to,
                    onClick: function (e) {
                        e.preventDefault();
                        console.warn('[Router Fix] Navigation disabled in minimal router');
                    }
                }, props.children);
            },
            useLocation: function () {
                return { pathname: window.location.pathname };
            },
            useHistory: function () {
                return {
                    push: function (path) {
                        console.warn('[Router Fix] Navigation disabled in minimal router');
                    },
                    replace: function (path) {
                        console.warn('[Router Fix] Navigation disabled in minimal router');
                    }
                };
            }
        };
    }

    // Create minimal Router DOM components if React Router DOM is not available
    if (!window.ReactRouterDOM) {
        console.warn('[Router Fix] React Router DOM not found, creating minimal router DOM');
        window.ReactRouterDOM = {
            ...window.ReactRouter,
            BrowserRouter: function (props) {
                console.warn('[Router Fix] Using minimal BrowserRouter');
                return props.children;
            },
            HashRouter: function (props) {
                console.warn('[Router Fix] Using minimal HashRouter');
                return props.children;
            }
        };
    }

    // Patch Router to handle common errors
    const originalRouter = window.ReactRouterDOM.BrowserRouter;
    window.ReactRouterDOM.BrowserRouter = function (props) {
        try {
            return React.createElement(originalRouter, props);
        } catch (error) {
            console.error('[Router Fix] Router error:', error);
            return props.children;
        }
    };

    // Add safety checks for common router hooks
    const safeHooks = ['useLocation', 'useHistory', 'useParams', 'useRouteMatch'];
    safeHooks.forEach(hookName => {
        const originalHook = window.ReactRouter[hookName];
        if (originalHook) {
            window.ReactRouter[hookName] = function () {
                try {
                    return originalHook.apply(this, arguments);
                } catch (error) {
                    console.error(`[Router Fix] ${hookName} error:`, error);
                    return {};
                }
            };
        }
    });

    console.log('[Router Fix] Router Provider fixes applied');
})();
