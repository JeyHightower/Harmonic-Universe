// Global React polyfill - executed before any modules load
(function () {
    console.log('[React Polyfill] Initializing...');

    // Create a complete mock React with common methods
    var MockReact = {
        // Core methods
        createElement: function () { return {}; },
        cloneElement: function (element) { return element; },

        // Context API
        createContext: function (defaultValue) {
            return {
                Provider: function (props) { return props.children; },
                Consumer: function (props) { return props.children(defaultValue); },
                _currentValue: defaultValue,
                displayName: 'Context'
            };
        },

        // Component APIs
        Component: function () { },
        PureComponent: function () { },

        // Hooks (minimal implementations)
        useState: function (initial) { return [initial, function () { }]; },
        useEffect: function () { },
        useContext: function (context) { return context._currentValue; },

        // Constants
        version: '16.14.0',

        // Fragment support
        Fragment: { $$typeof: Symbol.for('react.fragment') }
    };

    // Set prototype chain for Component classes
    MockReact.PureComponent.prototype = Object.create(MockReact.Component.prototype);

    // Make React globally available with multiple entry points
    if (typeof window !== 'undefined') {
        // Don't override a working React
        if (!window.React || !window.React.createContext) {
            window.React = window.React || {};

            // Copy all properties from MockReact to window.React
            for (var key in MockReact) {
                if (!window.React[key]) {
                    window.React[key] = MockReact[key];
                }
            }

            console.log('[React Polyfill] React methods patched/created');
        }

        // Create IconContext directly on window for immediate access
        window.IconContext = window.IconContext || MockReact.createContext({});

        // Create IconProvider directly
        window.IconProvider = window.IconProvider || {
            createContext: MockReact.createContext,
            version: "4.2.1"
        };
    }

    console.log('[React Polyfill] Ready');
})();
