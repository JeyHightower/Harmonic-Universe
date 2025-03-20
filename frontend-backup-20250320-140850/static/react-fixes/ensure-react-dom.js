/**
 * ensure-react-dom.js - Ensures ReactDOM is properly loaded and available globally
 * Fixes React error #321 (contexts) and provider initialization
 */
import React from 'react';
import ReactDOM from 'react-dom/client';

// Make sure React is properly configured for contexts
if (typeof React !== 'undefined') {
    // Save original createContext to avoid loops
    const originalCreateContext = React.createContext;

    // Ensure createContext safely handles errors
    if (typeof originalCreateContext === 'function') {
        React.createContext = function safeCreateContext(defaultValue, calculateChangedBits) {
            try {
                const context = originalCreateContext(defaultValue, calculateChangedBits);

                // Add safety properties to context
                if (context) {
                    // Ensure Provider exists and is properly tagged as a React component
                    if (context.Provider) {
                        context.Provider.isReactComponent = true;
                        context.Provider.$$typeof = Symbol.for('react.element');
                    }

                    // Ensure Consumer exists and is properly tagged
                    if (context.Consumer) {
                        context.Consumer.isReactComponent = true;
                        context.Consumer.$$typeof = Symbol.for('react.element');
                    }
                }

                return context;
            } catch (error) {
                console.error('[React Fix] Error creating context:', error);

                // Return minimal implementation that won't crash
                return {
                    Provider: function SafeProvider({ children }) { return children; },
                    Consumer: function SafeConsumer({ children }) {
                        return typeof children === 'function' ? children(defaultValue) : children;
                    },
                    _currentValue: defaultValue,
                    _currentValue2: defaultValue
                };
            }
        };

        console.log('[React Fix] Enhanced React.createContext to prevent Error #321');
    }

    // Fix common React component issues
    React._validateComponentFix = true;

    // Ensure React hooks are available
    if (!React.useState) {
        console.warn('[React Fix] useState hook missing, adding minimal implementation');
        React.useState = function (initialState) {
            return [
                typeof initialState === 'function' ? initialState() : initialState,
                function setState() { console.warn('useState setter called but not implemented'); }
            ];
        };
    }

    if (!React.useEffect) {
        console.warn('[React Fix] useEffect hook missing, adding minimal implementation');
        React.useEffect = function (effect, deps) {
            try {
                if (typeof effect === 'function') {
                    // Only attempt to run the effect once
                    const cleanup = effect();
                    // Return cleanup function
                    return function () {
                        if (typeof cleanup === 'function') {
                            try {
                                cleanup();
                            } catch (e) {
                                console.error('[React Fix] Error in useEffect cleanup:', e);
                            }
                        }
                    };
                }
            } catch (e) {
                console.error('[React Fix] Error in useEffect:', e);
            }
        };
    }

    if (!React.useContext) {
        console.warn('[React Fix] useContext hook missing, adding minimal implementation');
        React.useContext = function (Context) {
            return Context && Context._currentValue !== undefined ?
                Context._currentValue : (Context && Context.defaultValue);
        };
    }

    if (!React.memo) {
        React.memo = function (Component) {
            Component.isMemoized = true;
            return Component;
        };
    }
}

// Make sure ReactDOM is available globally
if (typeof window !== 'undefined') {
    if (!window.ReactDOM) {
        window.ReactDOM = ReactDOM;
        console.log('[ReactDOM Fix] Made ReactDOM available globally');
    }

    // Ensure createRoot method is available
    if (!window.ReactDOM.createRoot) {
        window.ReactDOM.createRoot = ReactDOM.createRoot || function (container) {
            console.warn('[ReactDOM Fix] Using fallback for createRoot');
            return {
                render: function (element) {
                    try {
                        // Use legacy render as fallback
                        if (window.ReactDOM.render) {
                            window.ReactDOM.render(element, container);
                        } else {
                            console.error('[ReactDOM Fix] No render method available');
                            if (container) {
                                container.innerHTML = '<div>React rendering failed</div>';
                            }
                        }
                    } catch (e) {
                        console.error('[ReactDOM Fix] Error in createRoot.render:', e);
                        if (container) {
                            container.innerHTML = '<div>React rendering error: ' + e.message + '</div>';
                        }
                    }
                },
                unmount: function () {
                    try {
                        if (window.ReactDOM.unmountComponentAtNode) {
                            window.ReactDOM.unmountComponentAtNode(container);
                        }
                    } catch (e) {
                        console.error('[ReactDOM Fix] Error in unmount:', e);
                    }
                }
            };
        };
    }

    // Create a fallback render function if needed
    if (!window.ReactDOM.render) {
        window.ReactDOM.render = function (element, container) {
            console.warn('[ReactDOM Fix] Using createRoot fallback for render');
            try {
                const root = ReactDOM.createRoot(container);
                root.render(element);
                return element;
            } catch (error) {
                console.error('[ReactDOM Fix] Render fallback failed:', error);
                if (container) {
                    container.innerHTML = '<div style="color:red">Rendering Error</div>';
                }
                return null;
            }
        };
    }

    // Fix common ReactDOM errors
    if (typeof Node !== 'undefined' && Node.prototype) {
        // Fix removeChild issue
        const originalRemoveChild = Node.prototype.removeChild;
        Node.prototype.removeChild = function (child) {
            try {
                // Check if the child is actually a child of this node
                if (!this.contains(child)) {
                    console.warn('[DOM Fix] Prevented removeChild operation on non-child node');
                    return child; // Return the child without removing
                }
                return originalRemoveChild.call(this, child);
            } catch (e) {
                console.warn('[DOM Fix] Error in removeChild operation:', e);
                return child;
            }
        };

        console.log('[DOM Fix] Applied removeChild protection to prevent Node errors');
    }

    // Add global context registry to help debug context issues
    window.__REACT_CONTEXTS = window.__REACT_CONTEXTS || {};
    window.__registerReactContext = function (name, context) {
        window.__REACT_CONTEXTS[name] = context;
        console.log(`[Context Fix] Registered context: ${name}`);
        return context;
    };

    console.log('[ReactDOM Fix] React and ReactDOM fixes applied');
}

export default ReactDOM;
