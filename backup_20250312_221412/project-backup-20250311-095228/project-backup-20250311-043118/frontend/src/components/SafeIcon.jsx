import React from 'react';

/**
 * SafeIcon component
 *
 * This component wraps Ant Design Icons to catch and handle errors,
 * preventing them from crashing the application.
 *
 * Usage:
 * import { SafeIcon } from './SafeIcon';
 * import { UserOutlined } from '@ant-design/icons';
 *
 * // Instead of <UserOutlined />
 * <SafeIcon icon={UserOutlined} fallbackClassName="user-icon" />
 */

export const SafeIcon = ({
    icon: IconComponent,
    fallbackClassName = '',
    ...props
}) => {
    // If no icon is provided, return null
    if (!IconComponent) {
        console.warn('SafeIcon: No icon component provided');
        return null;
    }

    try {
        // Try to render the icon component
        return <IconComponent {...props} />;
    } catch (error) {
        // Log the error
        console.error('Error rendering icon component:', error);

        // Return a fallback span element
        return (
            <span
                className={`anticon ${fallbackClassName}`}
                style={props.style || {}}
                {...props}
            />
        );
    }
};

/**
 * withIconErrorBoundary HOC
 *
 * A higher-order component that wraps an Ant Design Icon component
 * with error handling.
 *
 * Usage:
 * import { withIconErrorBoundary } from './SafeIcon';
 * import { UserOutlined } from '@ant-design/icons';
 *
 * const SafeUserOutlined = withIconErrorBoundary(UserOutlined);
 */
export const withIconErrorBoundary = (IconComponent) => {
    const SafeIconComponent = (props) => {
        return <SafeIcon icon={IconComponent} {...props} />;
    };

    SafeIconComponent.displayName = `Safe(${IconComponent?.displayName || 'Icon'})`;
    return SafeIconComponent;
};

export default SafeIcon;
