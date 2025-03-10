/**
 * React Diagnostics
 *
 * This script adds a diagnostic panel to help troubleshoot React loading issues.
 * It displays information about React, ReactDOM, context providers, and hook status.
 */

(function () {
    console.log('[React Diagnostics] Initializing...');

    // Configuration
    const config = {
        panelId: 'react-diagnostics-panel',
        buttonId: 'react-diagnostics-button',
        checkInterval: 1000,
        maxChecks: 30
    };

    // Create diagnostic panel
    function createDiagnosticPanel() {
        // Create container for diagnostics panel if it doesn't exist
        let diagnosticsPanel = document.getElementById(config.panelId);
        if (!diagnosticsPanel) {
            diagnosticsPanel = document.createElement('div');
            diagnosticsPanel.id = config.panelId;
            diagnosticsPanel.style.position = 'fixed';
            diagnosticsPanel.style.bottom = '10px';
            diagnosticsPanel.style.left = '10px';
            diagnosticsPanel.style.maxWidth = '90%';
            diagnosticsPanel.style.maxHeight = '80%';
            diagnosticsPanel.style.overflowY = 'auto';
            diagnosticsPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            diagnosticsPanel.style.color = 'white';
            diagnosticsPanel.style.padding = '15px';
            diagnosticsPanel.style.borderRadius = '5px';
            diagnosticsPanel.style.fontFamily = 'monospace';
            diagnosticsPanel.style.fontSize = '14px';
            diagnosticsPanel.style.zIndex = '10000';
            diagnosticsPanel.style.display = 'none';
            diagnosticsPanel.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';

            document.body.appendChild(diagnosticsPanel);
        }

        // Create button to toggle panel if it doesn't exist
        let toggleButton = document.getElementById(config.buttonId);
        if (!toggleButton) {
            toggleButton = document.createElement('button');
            toggleButton.id = config.buttonId;
            toggleButton.innerText = 'Show Diagnostics';
            toggleButton.style.position = 'fixed';
            toggleButton.style.top = '10px';
            toggleButton.style.right = '10px';
            toggleButton.style.backgroundColor = '#FF5722';
            toggleButton.style.color = 'white';
            toggleButton.style.border = 'none';
            toggleButton.style.borderRadius = '4px';
            toggleButton.style.padding = '8px 12px';
            toggleButton.style.fontWeight = 'bold';
            toggleButton.style.zIndex = '10001';
            toggleButton.style.cursor = 'pointer';
            toggleButton.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.3)';

            toggleButton.addEventListener('click', function () {
                const panel = document.getElementById(config.panelId);
                if (panel) {
                    const isVisible = panel.style.display !== 'none';
                    panel.style.display = isVisible ? 'none' : 'block';
                    toggleButton.innerText = isVisible ? 'Show Diagnostics' : 'Hide Diagnostics';

                    // Update diagnostics when panel is shown
                    if (!isVisible) {
                        updateDiagnostics();
                    }
                }
            });

            document.body.appendChild(toggleButton);
        }

        return { panel: diagnosticsPanel, button: toggleButton };
    }

    // Update diagnostics panel with current state
    function updateDiagnostics() {
        const panel = document.getElementById(config.panelId);
        if (!panel) return;

        const diagnostics = collectDiagnostics();

        // Clear current content
        panel.innerHTML = '';

        // Add title
        const title = document.createElement('h2');
        title.innerText = 'React Diagnostics';
        title.style.margin = '0 0 10px 0';
        title.style.color = '#FF5722';
        panel.appendChild(title);

        // Add React status
        addDiagnosticSection(panel, 'React Status', [
            { label: 'React Loaded', value: diagnostics.reactLoaded ? '✅' : '❌', status: diagnostics.reactLoaded ? 'good' : 'error' },
            { label: 'React Version', value: diagnostics.reactVersion || 'N/A', status: diagnostics.reactLoaded ? 'good' : 'warning' },
            { label: 'ReactDOM Loaded', value: diagnostics.reactDOMLoaded ? '✅' : '❌', status: diagnostics.reactDOMLoaded ? 'good' : 'error' },
            { label: 'ReactDOM Version', value: diagnostics.reactDOMVersion || 'N/A', status: diagnostics.reactDOMLoaded ? 'good' : 'warning' }
        ]);

        // Add Hook Status
        addDiagnosticSection(panel, 'Hook Status', [
            { label: 'useState Available', value: diagnostics.hookStatus.useState ? '✅' : '❌', status: diagnostics.hookStatus.useState ? 'good' : 'error' },
            { label: 'useEffect Available', value: diagnostics.hookStatus.useEffect ? '✅' : '❌', status: diagnostics.hookStatus.useEffect ? 'good' : 'error' },
            { label: 'useContext Available', value: diagnostics.hookStatus.useContext ? '✅' : '❌', status: diagnostics.hookStatus.useContext ? 'good' : 'error' },
            { label: 'Redux Hooks Available', value: diagnostics.hookStatus.reduxHooks ? '✅' : '❌', status: diagnostics.hookStatus.reduxHooks ? 'good' : 'warning' },
            { label: 'Router Hooks Available', value: diagnostics.hookStatus.routerHooks ? '✅' : '❌', status: diagnostics.hookStatus.routerHooks ? 'good' : 'warning' }
        ]);

        // Add Context Providers
        addDiagnosticSection(panel, 'Context Providers', [
            { label: 'Redux Provider', value: diagnostics.contextStatus.redux ? '✅' : '❌ (Using Mock)', status: diagnostics.contextStatus.redux ? 'good' : 'warning' },
            { label: 'Router Provider', value: diagnostics.contextStatus.router ? '✅' : '❌ (Using Mock)', status: diagnostics.contextStatus.router ? 'good' : 'warning' },
            { label: 'Theme Provider', value: diagnostics.contextStatus.theme ? '✅' : '❓', status: diagnostics.contextStatus.theme ? 'good' : 'normal' }
        ]);

        // Add DOM Status
        addDiagnosticSection(panel, 'DOM Status', [
            { label: 'Root Element', value: diagnostics.domStatus.rootElement ? '✅' : '❌', status: diagnostics.domStatus.rootElement ? 'good' : 'error' },
            { label: 'Modal Root Element', value: diagnostics.domStatus.modalRoot ? '✅' : '❌', status: diagnostics.domStatus.modalRoot ? 'good' : 'warning' },
            { label: 'Root Content Length', value: diagnostics.domStatus.rootContentLength + ' characters', status: diagnostics.domStatus.rootContentLength > 0 ? 'good' : 'error' }
        ]);

        // Add Resource Errors
        if (diagnostics.resourceErrors.length > 0) {
            const errorsList = diagnostics.resourceErrors.map(err => (
                { label: err.url, value: err.error, status: 'error' }
            ));
            addDiagnosticSection(panel, 'Resource Errors', errorsList);
        }

        // Add JavaScript Errors
        if (diagnostics.jsErrors.length > 0) {
            const errorsList = diagnostics.jsErrors.map(err => (
                { label: err.message, value: err.location, status: 'error' }
            ));
            addDiagnosticSection(panel, 'JavaScript Errors', errorsList);
        }

        // Add Module Loading Status
        const modulesStatus = Object.keys(diagnostics.moduleStatus).map(moduleName => ({
            label: moduleName,
            value: diagnostics.moduleStatus[moduleName] ? '✅' : '❌',
            status: diagnostics.moduleStatus[moduleName] ? 'good' : 'warning'
        }));

        if (modulesStatus.length > 0) {
            addDiagnosticSection(panel, 'Module Loading Status', modulesStatus);
        }

        // Add Suggestions
        const suggestions = [];

        if (!diagnostics.reactLoaded) {
            suggestions.push({ label: '⚠️', value: 'React is not loaded. Ensure React script is included before all other scripts.', status: 'error' });
        }

        if (diagnostics.reactLoaded && !diagnostics.reactDOMLoaded) {
            suggestions.push({ label: '⚠️', value: 'ReactDOM is not loaded. Ensure ReactDOM script is included.', status: 'error' });
        }

        if (!diagnostics.hookStatus.useState || !diagnostics.hookStatus.useEffect || !diagnostics.hookStatus.useContext) {
            suggestions.push({ label: '⚠️', value: 'Basic React hooks are missing. Ensure React version 16.8+ is used.', status: 'error' });
        }

        if (!diagnostics.contextStatus.redux) {
            suggestions.push({ label: '⚠️', value: 'Redux context is missing. A mock provider is being used.', status: 'warning' });
        }

        if (!diagnostics.contextStatus.router) {
            suggestions.push({ label: '⚠️', value: 'Router context is missing. A mock provider is being used.', status: 'warning' });
        }

        if (diagnostics.domStatus.rootElement && diagnostics.domStatus.rootContentLength === 0) {
            suggestions.push({ label: '⚠️', value: 'Root element exists but has no content. React may not be rendering correctly.', status: 'error' });
        }

        if (diagnostics.resourceErrors.length > 0) {
            suggestions.push({ label: '⚠️', value: `${diagnostics.resourceErrors.length} resource errors found. Check network requests.`, status: 'error' });
        }

        if (suggestions.length > 0) {
            addDiagnosticSection(panel, 'Suggestions', suggestions);
        }

        // Add user actions
        const actions = [
            {
                label: 'Clear Cache and Reload',
                action: () => {
                    if (window.confirm('This will clear the cache and reload the page. Continue?')) {
                        window.location.reload(true);
                    }
                }
            },
            {
                label: 'Reload With Safe Mode',
                action: () => {
                    if (window.confirm('This will reload in safe mode with minimal scripts. Continue?')) {
                        window.location.href = window.location.pathname + '?safe=1';
                    }
                }
            },
            {
                label: 'Show Debug Data',
                action: () => {
                    console.log('React Diagnostics Debug Data:', diagnostics);
                    alert('Debug data logged to console. Press F12 to view.');
                }
            }
        ];

        // Add actions section
        const actionsSection = document.createElement('div');
        actionsSection.style.marginTop = '20px';
        actionsSection.style.borderTop = '1px solid #555';
        actionsSection.style.paddingTop = '10px';

        const actionsTitle = document.createElement('h3');
        actionsTitle.innerText = 'Actions';
        actionsTitle.style.margin = '0 0 10px 0';
        actionsTitle.style.color = '#FF5722';
        actionsSection.appendChild(actionsTitle);

        actions.forEach(action => {
            const button = document.createElement('button');
            button.innerText = action.label;
            button.style.marginRight = '10px';
            button.style.marginBottom = '10px';
            button.style.padding = '5px 10px';
            button.style.borderRadius = '4px';
            button.style.border = 'none';
            button.style.backgroundColor = '#444';
            button.style.color = 'white';
            button.style.cursor = 'pointer';
            button.addEventListener('click', action.action);
            actionsSection.appendChild(button);
        });

        panel.appendChild(actionsSection);
    }

    // Helper function to add a section to the diagnostics panel
    function addDiagnosticSection(panel, title, items) {
        const section = document.createElement('div');
        section.style.marginBottom = '15px';

        const sectionTitle = document.createElement('h3');
        sectionTitle.innerText = title;
        sectionTitle.style.margin = '0 0 5px 0';
        sectionTitle.style.color = '#FF5722';
        section.appendChild(sectionTitle);

        const list = document.createElement('ul');
        list.style.margin = '0';
        list.style.padding = '0 0 0 20px';

        items.forEach(item => {
            const listItem = document.createElement('li');
            listItem.style.marginBottom = '5px';

            const label = document.createElement('span');
            label.innerText = item.label + ': ';

            const value = document.createElement('span');
            value.innerText = item.value;

            // Style based on status
            switch (item.status) {
                case 'good':
                    value.style.color = '#4CAF50';
                    break;
                case 'warning':
                    value.style.color = '#FFC107';
                    break;
                case 'error':
                    value.style.color = '#F44336';
                    break;
                default:
                    value.style.color = 'inherit';
            }

            listItem.appendChild(label);
            listItem.appendChild(value);
            list.appendChild(listItem);
        });

        section.appendChild(list);
        panel.appendChild(section);
    }

    // Track resource loading errors
    function trackResourceErrors() {
        const resourceErrors = [];

        // Create a proxy for fetch
        const originalFetch = window.fetch;
        window.fetch = function (url, options) {
            return originalFetch(url, options)
                .then(response => {
                    if (!response.ok) {
                        resourceErrors.push({ url: url.toString(), error: `${response.status} ${response.statusText}` });
                    }
                    return response;
                })
                .catch(error => {
                    resourceErrors.push({ url: url.toString(), error: error.message });
                    throw error;
                });
        };

        return function getResourceErrors() {
            return resourceErrors;
        };
    }

    // Get resource errors
    const getResourceErrors = trackResourceErrors();

    // Track JavaScript errors
    function trackJsErrors() {
        const jsErrors = [];

        window.addEventListener('error', function (event) {
            jsErrors.push({
                message: event.message,
                location: `${event.filename}:${event.lineno}:${event.colno}`,
                stack: event.error?.stack
            });
        });

        window.addEventListener('unhandledrejection', function (event) {
            jsErrors.push({
                message: `Unhandled Promise Rejection: ${event.reason}`,
                location: 'Promise',
                stack: event.reason?.stack
            });
        });

        return function getJsErrors() {
            return jsErrors;
        };
    }

    // Get JavaScript errors
    const getJsErrors = trackJsErrors();

    // Collect all diagnostics
    function collectDiagnostics() {
        const React = window.React;
        const ReactDOM = window.ReactDOM;
        const rootElement = document.getElementById('root');
        const modalRoot = document.getElementById('modal-root');

        return {
            reactLoaded: !!React,
            reactVersion: React?.version,
            reactDOMLoaded: !!ReactDOM,
            reactDOMVersion: ReactDOM?.version,

            hookStatus: {
                useState: typeof React?.useState === 'function',
                useEffect: typeof React?.useEffect === 'function',
                useContext: typeof React?.useContext === 'function',
                reduxHooks: typeof window.useSelector === 'function' && typeof window.useDispatch === 'function',
                routerHooks: typeof window.useNavigate === 'function' && typeof window.useLocation === 'function'
            },

            contextStatus: {
                redux: !!window.ReduxContext && !window.__mockReduxStore,
                router: !!window.RouterContext && !window.RouterContext._isMock,
                theme: !!window.ThemeContext
            },

            domStatus: {
                rootElement: !!rootElement,
                modalRoot: !!modalRoot,
                rootContentLength: rootElement ? rootElement.innerHTML.length : 0
            },

            resourceErrors: getResourceErrors(),
            jsErrors: getJsErrors(),

            moduleStatus: {
                'Redux': typeof window.useSelector === 'function',
                'React Router': typeof window.useNavigate === 'function',
                'react-error-handler.js': !!document.querySelector('script[src*="react-error-handler.js"]'),
                'react-polyfill.js': !!document.querySelector('script[src*="react-polyfill.js"]'),
                'hook-fix.js': !!document.querySelector('script[src*="hook-fix.js"]'),
                'react-context-provider.js': !!document.querySelector('script[src*="react-context-provider.js"]'),
                'react-version-checker.js': !!document.querySelector('script[src*="react-version-checker.js"]')
            }
        };
    }

    // Initialize diagnostics
    function init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => setupDiagnostics());
        } else {
            setupDiagnostics();
        }

        function setupDiagnostics() {
            try {
                // Create diagnostics UI
                const { panel, button } = createDiagnosticPanel();

                let checkCount = 0;
                const intervalId = setInterval(() => {
                    // Update diagnostics
                    updateDiagnostics();

                    checkCount++;

                    // Clear interval after max checks
                    if (checkCount >= config.maxChecks) {
                        clearInterval(intervalId);
                    }

                    // Also clear if React and ReactDOM are loaded
                    const diagnostics = collectDiagnostics();
                    if (diagnostics.reactLoaded && diagnostics.reactDOMLoaded &&
                        diagnostics.domStatus.rootContentLength > 0) {
                        clearInterval(intervalId);
                    }
                }, config.checkInterval);

                // Make diagnostic functions available globally for debugging
                window.__reactDiagnostics = {
                    update: updateDiagnostics,
                    collect: collectDiagnostics,
                    show: () => {
                        const panel = document.getElementById(config.panelId);
                        const button = document.getElementById(config.buttonId);
                        if (panel) {
                            panel.style.display = 'block';
                            if (button) button.innerText = 'Hide Diagnostics';
                            updateDiagnostics();
                        }
                    },
                    hide: () => {
                        const panel = document.getElementById(config.panelId);
                        const button = document.getElementById(config.buttonId);
                        if (panel) {
                            panel.style.display = 'none';
                            if (button) button.innerText = 'Show Diagnostics';
                        }
                    }
                };

                console.log('[React Diagnostics] Setup complete. Use window.__reactDiagnostics to access diagnostics functions.');
            } catch (error) {
                console.error('[React Diagnostics] Error setting up diagnostics:', error);
            }
        }
    }

    // Start initialization
    init();
})();
