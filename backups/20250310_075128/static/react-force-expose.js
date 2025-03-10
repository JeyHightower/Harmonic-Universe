/**
 * React Force Expose
 *
 * This script forcefully exposes React from bundled applications that might
 * hide it inside a closure or module scope. It searches the JavaScript environment
 * for React-like objects and exposes them globally.
 */

(function () {
    console.log('[React Force Expose] Initializing...');

    // Store found instances
    const reactCandidates = [];
    const reactDOMCandidates = [];

    // Function to check if an object is React-like
    function looksLikeReact(obj) {
        return obj &&
            typeof obj === 'object' &&
            typeof obj.createElement === 'function' &&
            typeof obj.Component === 'function' &&
            obj.version !== undefined;
    }

    // Function to check if an object is ReactDOM-like
    function looksLikeReactDOM(obj) {
        return obj &&
            typeof obj === 'object' &&
            typeof obj.render === 'function' &&
            typeof obj.createPortal === 'function' &&
            obj.version !== undefined;
    }

    // Function to try to find React in various places
    function findReactInstances() {
        console.log('[React Force Expose] Searching for React instances...');

        // Check the window object for known properties
        for (const key in window) {
            try {
                const obj = window[key];

                // Check if this looks like React
                if (looksLikeReact(obj)) {
                    console.log(`[React Force Expose] Found React-like object in window.${key}, version:`, obj.version);
                    reactCandidates.push({
                        object: obj,
                        location: `window.${key}`,
                        version: obj.version
                    });
                }

                // Check if this looks like ReactDOM
                if (looksLikeReactDOM(obj)) {
                    console.log(`[React Force Expose] Found ReactDOM-like object in window.${key}, version:`, obj.version);
                    reactDOMCandidates.push({
                        object: obj,
                        location: `window.${key}`,
                        version: obj.version
                    });
                }

                // Check object properties if this is an object
                if (obj && typeof obj === 'object' && obj !== window) {
                    for (const prop in obj) {
                        try {
                            const nestedObj = obj[prop];

                            // Check if this looks like React
                            if (looksLikeReact(nestedObj)) {
                                console.log(`[React Force Expose] Found React-like object in window.${key}.${prop}, version:`, nestedObj.version);
                                reactCandidates.push({
                                    object: nestedObj,
                                    location: `window.${key}.${prop}`,
                                    version: nestedObj.version
                                });
                            }

                            // Check if this looks like ReactDOM
                            if (looksLikeReactDOM(nestedObj)) {
                                console.log(`[React Force Expose] Found ReactDOM-like object in window.${key}.${prop}, version:`, nestedObj.version);
                                reactDOMCandidates.push({
                                    object: nestedObj,
                                    location: `window.${key}.${prop}`,
                                    version: nestedObj.version
                                });
                            }
                        } catch (e) {
                            // Ignore access errors in nested properties
                        }
                    }
                }
            } catch (e) {
                // Ignore access errors on window properties
            }
        }

        // Check for React in script tags
        const scripts = document.querySelectorAll('script');
        scripts.forEach(script => {
            try {
                // Only check scripts with content, not external scripts
                if (script.textContent && script.textContent.length > 100) {
                    const content = script.textContent;

                    // Look for React signature in the script content
                    if (content.includes('createElement') &&
                        content.includes('Component') &&
                        content.includes('version')) {
                        console.log('[React Force Expose] Found script tag with potential React code');

                        // Try to evaluate the script in an isolated context to extract React
                        try {
                            const scriptFunc = new Function('window', 'document', `
                let extractedReact = null;
                let extractedReactDOM = null;

                // Mock React detection function to capture React reference
                const createElement = function() {};
                const Component = function() {};

                // Capture module.exports
                const module = { exports: {} };
                ${content}

                // Return any found objects
                return {
                  moduleExports: module.exports,
                  windowReact: window.React,
                  windowReactDOM: window.ReactDOM
                };
              `);

                            const result = scriptFunc({}, {});

                            // Check module.exports for React
                            if (result.moduleExports && looksLikeReact(result.moduleExports)) {
                                console.log('[React Force Expose] Found React in module.exports');
                                reactCandidates.push({
                                    object: result.moduleExports,
                                    location: 'module.exports in script',
                                    version: result.moduleExports.version
                                });
                            }

                            // Check for window assignments
                            if (result.windowReact && looksLikeReact(result.windowReact)) {
                                console.log('[React Force Expose] Found React assigned to window.React in script');
                                reactCandidates.push({
                                    object: result.windowReact,
                                    location: 'window.React in script',
                                    version: result.windowReact.version
                                });
                            }

                            if (result.windowReactDOM && looksLikeReactDOM(result.windowReactDOM)) {
                                console.log('[React Force Expose] Found ReactDOM assigned to window.ReactDOM in script');
                                reactDOMCandidates.push({
                                    object: result.windowReactDOM,
                                    location: 'window.ReactDOM in script',
                                    version: result.windowReactDOM.version
                                });
                            }
                        } catch (evalError) {
                            // Ignore evaluation errors
                        }
                    }
                }
            } catch (e) {
                // Ignore errors
            }
        });

        // Check for React DevTools
        if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
            console.log('[React Force Expose] Found React DevTools hook');

            const devTools = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;

            // Check renderers Map in DevTools
            if (devTools.renderers && typeof devTools.renderers.forEach === 'function') {
                devTools.renderers.forEach((renderer, id) => {
                    if (renderer && looksLikeReact(renderer)) {
                        console.log(`[React Force Expose] Found React in DevTools renderer #${id}, version:`, renderer.version);
                        reactCandidates.push({
                            object: renderer,
                            location: `DevTools renderer #${id}`,
                            version: renderer.version
                        });
                    }
                });
            }

            // Try to get React from fiber roots
            if (devTools.onCommitFiberRoot && devTools._renderers) {
                // Renderers might contain React instances
                for (const id in devTools._renderers) {
                    const renderer = devTools._renderers[id];
                    if (renderer && renderer.bundleType !== undefined) {
                        console.log(`[React Force Expose] Found React renderer in DevTools _renderers #${id}`);

                        // Try to extract React from renderer
                        if (renderer.React) {
                            reactCandidates.push({
                                object: renderer.React,
                                location: `DevTools _renderers[${id}].React`,
                                version: renderer.React.version
                            });
                        }
                    }
                }
            }
        }

        // Log findings
        console.log(`[React Force Expose] Found ${reactCandidates.length} React candidates and ${reactDOMCandidates.length} ReactDOM candidates`);

        return {
            reactCandidates,
            reactDOMCandidates
        };
    }

    // Function to expose found instances globally
    function exposeReactGlobally() {
        // Find all instances first
        const { reactCandidates, reactDOMCandidates } = findReactInstances();

        // Try to expose React if not already available
        if (!window.React && reactCandidates.length > 0) {
            // Sort candidates by version to get the latest one
            reactCandidates.sort((a, b) => {
                // Compare versions (assumes semver format)
                const aVer = a.version && a.version.split('.').map(Number);
                const bVer = b.version && b.version.split('.').map(Number);

                if (!aVer) return 1;
                if (!bVer) return -1;

                for (let i = 0; i < Math.max(aVer.length, bVer.length); i++) {
                    const aVal = aVer[i] || 0;
                    const bVal = bVer[i] || 0;
                    if (aVal !== bVal) {
                        return bVal - aVal; // Higher version first
                    }
                }

                return 0;
            });

            // Use the first (highest version) candidate
            const bestReactCandidate = reactCandidates[0];
            console.log(`[React Force Expose] Exposing React globally from ${bestReactCandidate.location}, version ${bestReactCandidate.version}`);

            window.React = bestReactCandidate.object;

            // Create a event to notify other scripts
            window.dispatchEvent(new CustomEvent('react-available', {
                detail: window.React
            }));
        } else if (window.React) {
            console.log('[React Force Expose] React is already globally available:', window.React.version);

            // Still dispatch event for consistency
            window.dispatchEvent(new CustomEvent('react-available', {
                detail: window.React
            }));
        }

        // Try to expose ReactDOM if not already available
        if (!window.ReactDOM && reactDOMCandidates.length > 0) {
            // Sort candidates by version to get the latest one
            reactDOMCandidates.sort((a, b) => {
                // Compare versions (assumes semver format)
                const aVer = a.version && a.version.split('.').map(Number);
                const bVer = b.version && b.version.split('.').map(Number);

                if (!aVer) return 1;
                if (!bVer) return -1;

                for (let i = 0; i < Math.max(aVer.length, bVer.length); i++) {
                    const aVal = aVer[i] || 0;
                    const bVal = bVer[i] || 0;
                    if (aVal !== bVal) {
                        return bVal - aVal; // Higher version first
                    }
                }

                return 0;
            });

            // Use the first (highest version) candidate
            const bestReactDOMCandidate = reactDOMCandidates[0];
            console.log(`[React Force Expose] Exposing ReactDOM globally from ${bestReactDOMCandidate.location}, version ${bestReactDOMCandidate.version}`);

            window.ReactDOM = bestReactDOMCandidate.object;

            // Create a event to notify other scripts
            window.dispatchEvent(new CustomEvent('reactdom-available', {
                detail: window.ReactDOM
            }));
        } else if (window.ReactDOM) {
            console.log('[React Force Expose] ReactDOM is already globally available:', window.ReactDOM.version);

            // Still dispatch event for consistency
            window.dispatchEvent(new CustomEvent('reactdom-available', {
                detail: window.ReactDOM
            }));
        }

        // Return results for debugging
        return {
            React: window.React,
            ReactDOM: window.ReactDOM,
            reactCandidates,
            reactDOMCandidates
        };
    }

    // Run immediately and then periodically
    exposeReactGlobally();

    // Try again after scripts have had time to load
    const checkInterval = setInterval(function () {
        // Check if we've found and exposed React already
        if (window.React && window.ReactDOM) {
            console.log('[React Force Expose] React and ReactDOM both found and exposed, stopping checks');
            clearInterval(checkInterval);
            return;
        }

        // Re-run exposure
        console.log('[React Force Expose] Re-checking for React instances...');
        exposeReactGlobally();
    }, 1000);

    // Stop checking after a reasonable amount of time (10 seconds)
    setTimeout(function () {
        clearInterval(checkInterval);
        console.log('[React Force Expose] Stopping periodic checks');

        // Report final status
        if (!window.React) {
            console.warn('[React Force Expose] Failed to find and expose React globally');
        }
        if (!window.ReactDOM) {
            console.warn('[React Force Expose] Failed to find and expose ReactDOM globally');
        }
    }, 10000);

    // Make this function available for debugging
    window.__forceExposeReact = exposeReactGlobally;
})();
