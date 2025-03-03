import React from 'react';

// Add debug log with a unique identifier
console.log('==== CONTEXT.JS IS BEING LOADED ====');

try {
    // Create a Context for icon configuration
    const IconContext = React.createContext({
        // Default values for the context
        prefixCls: 'anticon',
        rootClassName: '',
        rtl: false
    });

    // Set displayName directly on the context as recommended by React
    IconContext.displayName = 'IconContext';

    // Success log
    console.log('Icon context created successfully:', IconContext);

    // Export the default context
    export default IconContext;

    // Also provide a named export for flexibility
    export { IconContext };
} catch (error) {
    console.error('Error creating IconContext:', error);

    // Create a fallback context to prevent crashes
    const FallbackIconContext = React.createContext({
        prefixCls: 'anticon',
        rootClassName: '',
        rtl: false
    });

    FallbackIconContext.displayName = 'FallbackIconContext';

    console.log('Using fallback icon context');

    export default FallbackIconContext;
    export { FallbackIconContext as IconContext };
}
