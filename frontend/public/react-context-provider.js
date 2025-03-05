// Browser-compatible script - NO ES module syntax
(function () {
    console.log('[React Context Provider] Initializing...');

    // Create a minimal React-like object with createContext
    var MockReact = {
        createElement: function () { return {}; },
        createContext: function (defaultValue) {
            return {
                Provider: function (props) { return props.children; },
                Consumer: function (props) { return props.children(defaultValue); },
                _currentValue: defaultValue
            };
        },
        version: '16.8.0' // Provide a version for compatibility
    };

    // Make React globally available
    if (typeof window !== 'undefined') {
        // Only set if not already defined
        if (!window.React) {
            window.React = MockReact;
            console.log('[React Context Provider] Mock React object created');
        }
        // If React exists but createContext doesn't, add it
        else if (!window.React.createContext) {
            window.React.createContext = MockReact.createContext;
            console.log('[React Context Provider] Added createContext to existing React');
        }

        // Also expose React as a global variable under different common names
        // Some bundles might look for it under different names
        window.react = window.React;
        window.ReactModule = window.React;
        window._React = window.React;
    }

    console.log('[React Context Provider] Ready');
})();
