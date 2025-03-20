/**
 * Ensures ReactDOM is available and properly configured
 */
(function () {
    if (!window.ReactDOM) {
        console.warn('[ReactDOM Fix] ReactDOM not found, creating polyfill');
        window.ReactDOM = {
            version: '16.8.0',
            render: function (element, container) {
                console.warn('[ReactDOM Fix] Using polyfill render');
                if (container) container.innerHTML = '<div>React rendering not available</div>';
            },
            createRoot: function (container) {
                console.warn('[ReactDOM Fix] Using polyfill createRoot');
                return {
                    render: function (element) {
                        if (container) container.innerHTML = '<div>React root rendering not available</div>';
                    }
                };
            }
        };
    }

    // Patch ReactDOM.render to handle errors gracefully
    const originalRender = window.ReactDOM.render;
    window.ReactDOM.render = function (element, container, callback) {
        try {
            return originalRender(element, container, callback);
        } catch (error) {
            console.error('[ReactDOM Fix] Render error:', error);
            if (container) {
                container.innerHTML = '<div>Error rendering React component</div>';
            }
        }
    };

    // Ensure createRoot is available for React 18+
    if (!window.ReactDOM.createRoot) {
        window.ReactDOM.createRoot = function (container) {
            console.warn('[ReactDOM Fix] Using legacy render adapter for createRoot');
            return {
                render: function (element) {
                    window.ReactDOM.render(element, container);
                }
            };
        };
    }

    console.log('[ReactDOM Fix] ReactDOM fixes applied');
})();
