import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    addNotification,
    clearNotifications,
    removeNotification,
    setActiveTab,
    setIsEditing,
    toggleCollaborators,
    toggleDarkMode,
    toggleSettings,
    toggleSidebar
} from '../store/slices/uiSlice';

export const useUI = () => {
    const dispatch = useDispatch();
    const {
        sidebarOpen,
        darkMode,
        notifications,
        activeTab,
        isEditing,
        showCollaborators,
        showSettings
    } = useSelector((state) => state.ui);

    const handleToggleSidebar = useCallback(() => {
        dispatch(toggleSidebar());
    }, [dispatch]);

    const handleToggleDarkMode = useCallback(() => {
        dispatch(toggleDarkMode());
    }, [dispatch]);

    const handleAddNotification = useCallback((notification) => {
        dispatch(addNotification(notification));
        if (notification.timeout) {
            setTimeout(() => {
                dispatch(removeNotification(notification.id));
            }, notification.timeout);
        }
    }, [dispatch]);

    const handleRemoveNotification = useCallback((id) => {
        dispatch(removeNotification(id));
    }, [dispatch]);

    const handleSetActiveTab = useCallback((tab) => {
        dispatch(setActiveTab(tab));
    }, [dispatch]);

    const handleSetIsEditing = useCallback((value) => {
        dispatch(setIsEditing(value));
    }, [dispatch]);

    const handleToggleCollaborators = useCallback(() => {
        dispatch(toggleCollaborators());
    }, [dispatch]);

    const handleToggleSettings = useCallback(() => {
        dispatch(toggleSettings());
    }, [dispatch]);

    const handleClearNotifications = useCallback(() => {
        dispatch(clearNotifications());
    }, [dispatch]);

    return {
        sidebarOpen,
        darkMode,
        notifications,
        activeTab,
        isEditing,
        showCollaborators,
        showSettings,
        toggleSidebar: handleToggleSidebar,
        toggleDarkMode: handleToggleDarkMode,
        addNotification: handleAddNotification,
        removeNotification: handleRemoveNotification,
        setActiveTab: handleSetActiveTab,
        setIsEditing: handleSetIsEditing,
        toggleCollaborators: handleToggleCollaborators,
        toggleSettings: handleToggleSettings,
        clearNotifications: handleClearNotifications
    };
};
