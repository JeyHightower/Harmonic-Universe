/**
 * React Version Checker
 *
 * This script helps diagnose common React issues in production:
 * 1. Multiple copies of React in the same application
 * 2. Mismatched versions between React and ReactDOM
 * 3. Incorrect React mode (development vs production)
 */

(function () {
    console.log('[React Version Checker] Starting check...');

    // Ensure process.env is available in the browser environment
    if (typeof window.process === 'undefined') {
        window.process = { env: { NODE_ENV: 'production' } };
    } else if (typeof window.process.env === 'undefined') {
        window.process.env = { NODE_ENV: 'production' };
    }

    // Listen for the React available event
    window.addEventListener('react-available', checkReactVersions);

    // Function to wait for React and ReactDOM to be available
    let checkAttempts = 0;
    const maxAttempts = 20;
    const checkInterval = setInterval(function () {
        checkAttempts++;

        // Check if React is available
        if (window.React) {
            console.log('[React Version Checker] React found, checking versions...');
            clearInterval(checkInterval);
            checkReactVersions();
        } else if (checkAttempts >= maxAttempts) {
            console.log('[React Version Checker] React not found after maximum attempts');
            clearInterval(checkInterval);
        }
    }, 300);

    // The main version checking function
    function checkReactVersions() {
        console.log('[React Version Checker] Checking React versions...');

        // Wait for window.React to be available
        const React = window.React;
        const ReactDOM = window.ReactDOM;

        if (!React) {
            console.log('[React Version Checker] React is not available yet');
            return;
        }

        // Check React details
        const reactInfo = {
            version: React.version || 'unknown',
            mode: (function getReactMode() {
                try {
                    // Development builds of React have DEV-only code that checks for useful warnings
                    const isDevCode = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED &&
                        React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner &&
                        React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner.current === null;

                    if (isDevCode) {
                        return 'development';
                    }

                    // Check process.env if it's been correctly defined
                    if (window.process && window.process.env && window.process.env.NODE_ENV) {
                        return window.process.env.NODE_ENV;
                    }

                    // Check for other development indicators
                    if (React.version && React.version.includes('-dev')) {
                        return 'development';
                    }

                    // Default to production
                    return 'production';
                } catch (error) {
                    console.error('[React Version Checker] Error detecting React mode:', error);
                    return 'unknown';
                }
            })(),
            hasMultipleInstances: false,
            locations: []
        };

        // Attempt to find multiple copies of React
        for (const key in window) {
            try {
                const obj = window[key];
                if (obj && obj.version && typeof obj.createElement === 'function' && obj !== React) {
                    reactInfo.hasMultipleInstances = true;
                    reactInfo.locations.push({
                        name: key,
                        version: obj.version
                    });
                }
            } catch (e) {
                // Skip properties that can't be accessed
            }
        }

        // Check ReactDOM if available
        let reactDOMInfo = {
            available: false,
            version: 'not loaded',
            versionMismatch: false
        };

        if (ReactDOM) {
            reactDOMInfo = {
                available: true,
                version: ReactDOM.version || 'unknown',
                versionMismatch: ReactDOM.version !== reactInfo.version
            };
        }

        // Log findings
        console.log('[React Version Checker] React version:', reactInfo.version);
        console.log('[React Version Checker] React mode:', reactInfo.mode);
        console.log('[React Version Checker] ReactDOM available:', reactDOMInfo.available);

        if (reactDOMInfo.available) {
            console.log('[React Version Checker] ReactDOM version:', reactDOMInfo.version);

            // Check for version mismatch
            if (reactDOMInfo.versionMismatch) {
                console.error(
                    '[React Version Checker] VERSION MISMATCH: React (' + reactInfo.version +
                    ') and ReactDOM (' + reactDOMInfo.version + ') versions do not match!'
                );
            } else {
                console.log('[React Version Checker] React and ReactDOM versions match');
            }
        } else {
            console.warn('[React Version Checker] ReactDOM not found! This may cause rendering issues.');
        }

        // Check for multiple copies of React
        if (reactInfo.hasMultipleInstances) {
            console.error('[React Version Checker] Multiple copies of React detected:');
            reactInfo.locations.forEach(location => {
                console.error(`  - ${location.name}: version ${location.version}`);
            });
            console.error('[React Version Checker] This can cause hook errors and unexpected behavior!');
        }

        // Check for wrong mode
        if (reactInfo.mode === 'development' && window.location.hostname !== 'localhost') {
            console.warn(
                '[React Version Checker] Running React in DEVELOPMENT mode in production environment! ' +
                'This significantly reduces performance.'
            );
        } else if (reactInfo.mode === 'production') {
            console.log('[React Version Checker] Running React in PRODUCTION mode');
        }

        // Make findings available globally for diagnostics
        window.__REACT_VERSION_INFO__ = {
            react: reactInfo,
            reactDOM: reactDOMInfo,
            timestamp: new Date().toISOString(),
            checkComplete: true
        };

        // Dispatch an event with the version info
        window.dispatchEvent(new CustomEvent('react-version-checked', {
            detail: window.__REACT_VERSION_INFO__
        }));

        console.log('[React Version Checker] Check complete');

        return window.__REACT_VERSION_INFO__;
    }

    // Try to check immediately if React is already available
    if (window.React) {
        checkReactVersions();
    }
})();
