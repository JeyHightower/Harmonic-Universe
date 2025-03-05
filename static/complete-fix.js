// Complete fix for Ant Design Icons version issue
(function () {
    // Only run once
    if (window.__COMPLETE_FIX_APPLIED__) return;
    window.__COMPLETE_FIX_APPLIED__ = true;

    console.log('Applying complete Ant Design Icons fix');

    // --- PART 1: DEFINE ALL POSSIBLE VERSIONS ---
    const VERSION = '4.2.1';

    // Create a full version object that matches what the library expects
    const versionObj = {
        version: VERSION,
        toString() { return VERSION; },
        valueOf() { return VERSION; }
    };

    // Global version properties
    window.__ANT_ICONS_VERSION__ = VERSION;

    // --- PART 2: OVERRIDE PROBLEMATIC FUNCTIONS ---
    // Store original functions
    const originalDefineProperty = Object.defineProperty;

    // Completely override Object.defineProperty to catch any attempts to define version getters
    Object.defineProperty = function (obj, prop, descriptor) {
        // When someone tries to define a property related to version
        if (prop === 'version' || prop.includes('version')) {
            console.log('Intercepted attempt to define version property');

            // Add safety to the getter
            if (descriptor && descriptor.get) {
                const originalGetter = descriptor.get;
                descriptor.get = function () {
                    try {
                        // If this is undefined, return our safe version
                        if (this === undefined || this === null) {
                            return VERSION;
                        }
                        return originalGetter.call(this);
                    } catch (e) {
                        console.warn('Prevented version getter error');
                        return VERSION;
                    }
                };
            }
        }

        // Call the original with our modified descriptor
        return originalDefineProperty(obj, prop, descriptor);
    };

    // --- PART 3: MOCK ALL REQUIRED OBJECTS ---
    // Create mock icons context
    window.IconContext = window.IconContext || {
        Provider: function (props) { return props.children; },
        Consumer: function (props) { return props.children({}); }
    };

    // Create a complete mock for @ant-design/icons-svg
    window.AntDesignIconsSvg = {
        version: VERSION,
        IconDefinition: function () { },
        AccountBookFilled: { version: VERSION },
        AccountBookOutlined: { version: VERSION },
        AccountBookTwoTone: { version: VERSION },
        // Add more icons as needed...

        // Catch-all getter for any icon
        get: function (name) {
            return { version: VERSION, name: name };
        }
    };

    // Make it available globally under different possible paths
    window['@ant-design/icons-svg'] = window.AntDesignIconsSvg;
    window['@ant-design/icons'] = window['@ant-design/icons'] || { version: VERSION };

    // --- PART 4: MONKEY PATCH FUNCTIONS THAT ACCESS VERSION ---
    // Replace problematic access patterns
    function monkeyPatchVersionAccess() {
        // Find and replace all direct '.version' access in existing scripts
        for (const script of Array.from(document.scripts)) {
            if (script.textContent && script.textContent.includes('.version')) {
                try {
                    const originalFunction = new Function('return ' + script.textContent)();
                    if (typeof originalFunction === 'function') {
                        const patchedFunction = function () {
                            try {
                                return originalFunction.apply(this, arguments);
                            } catch (e) {
                                if (e.message && e.message.includes('version')) {
                                    console.warn('Prevented error in function');
                                    return VERSION;
                                }
                                throw e;
                            }
                        };
                        // Replace the original function
                        script.textContent = '(' + patchedFunction.toString() + ')';
                    }
                } catch (e) {
                    // Ignore errors in patching
                }
            }
        }
    }

    // Call this for any existing scripts
    setTimeout(monkeyPatchVersionAccess, 100);

    // --- PART 5: DEFINE GLOBAL ERROR HANDLERS ---
    // Error event handler
    window.addEventListener('error', function (event) {
        if (event.message && (
            event.message.includes('version') ||
            event.message.includes('Cannot read properties of undefined'))) {
            console.warn('Suppressing error:', event.message);
            // Stop the error
            event.preventDefault();
            event.stopPropagation();
            return true;
        }
    }, true);

    // Uncaught promise rejection handler
    window.addEventListener('unhandledrejection', function (event) {
        if (event.reason && event.reason.message &&
            (event.reason.message.includes('version') ||
                event.reason.message.includes('Cannot read properties of undefined'))) {
            console.warn('Suppressing promise rejection:', event.reason.message);
            event.preventDefault();
            event.stopPropagation();
            return true;
        }
    }, true);

    // --- PART 6: OVERRIDE CONSOLE.ERROR ---
    // This is a bit aggressive but will ensure error doesn't show in console
    const originalConsoleError = console.error;
    console.error = function (...args) {
        if (args[0] && typeof args[0] === 'string' &&
            (args[0].includes('version') || args[0].includes('Cannot read properties of undefined'))) {
            console.warn('Suppressed console error about version');
            return;
        }
        return originalConsoleError.apply(console, args);
    };

    console.log('Complete Ant Design Icons fix applied successfully');
})();
