import React from 'react';

// Fallback handlers for React components
export const createFallbackComponent = (name, props) => {
    return {
        $$typeof: Symbol.for('react.element'),
        type: 'div',
        props: {
            className: 'react-fallback',
            'data-component': name,
            children: `Failed to load component: ${name}`
        },
        key: null,
        ref: null
    };
};

export const wrapWithFallback = (Component, name) => {
    return function FallbackWrapper(props) {
        try {
            return Component(props);
        } catch (error) {
            console.error(`Error in component ${name}:`, error);
            return createFallbackComponent(name, props);
        }
    };
};

export const FallbackBoundary = ({ children, name = 'Unknown' }) => {
    try {
        return children;
    } catch (error) {
        console.error(`Error in ${name}:`, error);
        return createFallbackComponent(name, {});
    }
};

export function FallbackComponent() {
    return React.createElement('div', null, 'Loading...');
}

export function ErrorBoundary({ children }) {
    return React.createElement(React.Fragment, null, children);
}
