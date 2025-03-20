import React from 'react';

// Add debug log with a unique identifier
console.log('==== CONTEXT.JS IS BEING LOADED ====');

// Declare variables to be exported
let IconContext;
let FallbackIconContext;

try {
    // Create a Context for icon configuration
    IconContext = React.createContext({
        // Default values for the context
        prefixCls: 'anticon',
        rootClassName: '',
        rtl: false
    });

    // Set displayName directly on the context as recommended by React
    IconContext.displayName = 'IconContext';

    // Success log
    console.log('Icon context created successfully:', IconContext);
} catch (error) {
    console.error('Error creating IconContext:', error);

    // Create a fallback context to prevent crashes
    FallbackIconContext = React.createContext({
        prefixCls: 'anticon',
        rootClassName: '',
        rtl: false
    });

    FallbackIconContext.displayName = 'FallbackIconContext';

    console.log('Using fallback icon context');

    // Use the fallback as the main export
    IconContext = FallbackIconContext;
}

// Export the context outside of the try-catch
export default IconContext;
export { IconContext };
