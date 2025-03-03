import React from 'react';

// Add debug log with a unique identifier
console.log('==== CONTEXT.JS IS BEING LOADED ====');

// Create a Context for icon configuration
const IconContext = React.createContext({
    // Default values for the context
    prefixCls: 'anticon',
    rootClassName: '',
    rtl: false
});

// Set displayName directly on the context as recommended by React
IconContext.displayName = 'IconContext';

// Export the default context
export default IconContext;

// Also provide a named export for flexibility
export { IconContext };
