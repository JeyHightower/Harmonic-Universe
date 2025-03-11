// Consolidated React fixes for critical functionality
import React from 'react';
import * as ReactDOM from 'react-dom';
import * as ReactDOMClient from 'react-dom/client';

// Ensure React is available globally
if (typeof window !== 'undefined') {
    window.React = React;
    window.ReactDOM = ReactDOM;
    window.ReactDOMClient = ReactDOMClient;
}

// Critical React fixes
export const criticalFixes = {
    ensureReactDOM: () => {
        if (typeof window === 'undefined') return;
        window.ReactDOM = window.ReactDOM || ReactDOM;
        window.ReactDOMClient = window.ReactDOMClient || ReactDOMClient;
    },

    ensureCreateRoot: () => {
        if (typeof window === 'undefined') return;
        if (!window.ReactDOM.createRoot) {
            window.ReactDOM.createRoot = function (container) {
                return {
                    render: (element) => ReactDOM.render(element, container),
                    unmount: () => ReactDOM.unmountComponentAtNode(container)
                };
            };
        }
    },

    patchCreateElement: () => {
        if (typeof React === 'undefined') return;
        const originalCreateElement = React.createElement;
        React.createElement = function (type, props, ...children) {
            try {
                return originalCreateElement(type, props, ...children);
            } catch (error) {
                console.error('[React Fix] createElement error:', error);
                return originalCreateElement('div', {
                    className: 'react-error',
                    'data-error': error.message
                }, 'Component Error');
            }
        };
    }
};

// Apply critical fixes immediately
Object.values(criticalFixes).forEach(fix => {
    try {
        fix();
    } catch (error) {
        console.error('[Critical Fix] Error applying fix:', error);
    }
});
