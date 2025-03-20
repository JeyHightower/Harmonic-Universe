/**
 * Safe Icons Module
 *
 * This module provides error-resistant versions of commonly used Ant Design Icons.
 * Import icons from this module instead of directly from @ant-design/icons
 * to prevent 500 errors due to version mismatches.
 */

import * as AntIcons from '@ant-design/icons';
import React from 'react';
import { SafeIcon, withIconErrorBoundary } from './SafeIcon';

// Fallback icon component that doesn't depend on Ant Design
export const FallbackIcon = ({ type, className, style, ...props }) => (
    <span
        className={`anticon anticon-${type || 'default'} ${className || ''}`}
        style={{ ...style }}
        {...props}
    />
);

// Create safe versions of commonly used icons
export const SafeUserOutlined = withIconErrorBoundary(AntIcons.UserOutlined);
export const SafeSettingOutlined = withIconErrorBoundary(AntIcons.SettingOutlined);
export const SafeHomeOutlined = withIconErrorBoundary(AntIcons.HomeOutlined);
export const SafeMenuOutlined = withIconErrorBoundary(AntIcons.MenuOutlined);
export const SafeCloseOutlined = withIconErrorBoundary(AntIcons.CloseOutlined);
export const SafeDownOutlined = withIconErrorBoundary(AntIcons.DownOutlined);
export const SafeUpOutlined = withIconErrorBoundary(AntIcons.UpOutlined);
export const SafeLeftOutlined = withIconErrorBoundary(AntIcons.LeftOutlined);
export const SafeRightOutlined = withIconErrorBoundary(AntIcons.RightOutlined);
export const SafeLoadingOutlined = withIconErrorBoundary(AntIcons.LoadingOutlined);
export const SafeCheckOutlined = withIconErrorBoundary(AntIcons.CheckOutlined);
export const SafePlusOutlined = withIconErrorBoundary(AntIcons.PlusOutlined);
export const SafeEditOutlined = withIconErrorBoundary(AntIcons.EditOutlined);
export const SafeDeleteOutlined = withIconErrorBoundary(AntIcons.DeleteOutlined);
export const SafeSearchOutlined = withIconErrorBoundary(AntIcons.SearchOutlined);
export const SafeInfoCircleOutlined = withIconErrorBoundary(AntIcons.InfoCircleOutlined);
export const SafeQuestionCircleOutlined = withIconErrorBoundary(AntIcons.QuestionCircleOutlined);
export const SafeExclamationCircleOutlined = withIconErrorBoundary(AntIcons.ExclamationCircleOutlined);

/**
 * Get a safe version of any Ant Design icon by name
 *
 * @param {string} iconName - Name of the icon (e.g., 'UserOutlined', 'SettingFilled')
 * @returns {React.Component} Safe icon component or fallback
 *
 * Usage:
 * import { getIcon } from './components/Icons';
 * const MyIcon = getIcon('UserOutlined');
 * // Then use: <MyIcon />
 */
export const getIcon = (iconName) => {
    try {
        // Check if the icon exists
        const IconComponent = AntIcons[iconName];

        if (!IconComponent) {
            console.warn(`Icon '${iconName}' not found, using fallback`);
            return (props) => <FallbackIcon type={iconName.toLowerCase()} {...props} />;
        }

        // Wrap with error boundary
        return withIconErrorBoundary(IconComponent);
    } catch (error) {
        console.error(`Error getting icon '${iconName}':`, error);
        return (props) => <FallbackIcon type={iconName.toLowerCase()} {...props} />;
    }
};

/**
 * Render any Ant Design icon safely by name
 *
 * @param {Object} props - Props for the icon
 * @param {string} props.name - Name of the icon (e.g., 'UserOutlined')
 * @param {string} props.fallbackType - Type for fallback icon if name is invalid
 * @param {Object} props.rest - Other props to pass to the icon
 * @returns {JSX.Element} Icon element or fallback
 *
 * Usage:
 * import { Icon } from './components/Icons';
 * <Icon name="UserOutlined" className="my-icon" />
 */
export const Icon = ({ name, fallbackType, ...rest }) => {
    if (!name) {
        return <FallbackIcon type={fallbackType || 'default'} {...rest} />;
    }

    try {
        const IconComponent = AntIcons[name];
        return <SafeIcon icon={IconComponent} fallbackClassName={name.toLowerCase()} {...rest} />;
    } catch (error) {
        console.error(`Error rendering icon '${name}':`, error);
        return <FallbackIcon type={fallbackType || name.toLowerCase()} {...rest} />;
    }
};

export default {
    Icon,
    getIcon,
    FallbackIcon,
    SafeUserOutlined,
    SafeSettingOutlined,
    SafeHomeOutlined,
    SafeMenuOutlined,
    SafeCloseOutlined,
    SafeDownOutlined,
    SafeUpOutlined,
    SafeLeftOutlined,
    SafeRightOutlined,
    SafeLoadingOutlined,
    SafeCheckOutlined,
    SafePlusOutlined,
    SafeEditOutlined,
    SafeDeleteOutlined,
    SafeSearchOutlined,
    SafeInfoCircleOutlined,
    SafeQuestionCircleOutlined,
    SafeExclamationCircleOutlined
};
