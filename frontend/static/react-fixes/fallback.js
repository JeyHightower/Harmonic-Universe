import React from 'react';

export function FallbackComponent() {
    return React.createElement('div', null, 'Loading...');
}

export function ErrorBoundary({ children }) {
    return React.createElement(React.Fragment, null, children);
}
