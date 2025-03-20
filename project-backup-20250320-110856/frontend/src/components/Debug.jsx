import React, { useEffect, useState } from 'react';
import '../styles/Debug.css';
import { clearLogs, enableDebugMode, getLogs, toggleLogging } from '../utils/logger';

/**
 * Debug panel component for viewing logs in production
 */
const Debug = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [logs, setLogs] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [refreshCount, setRefreshCount] = useState(0);
    const [autoRefresh, setAutoRefresh] = useState(false);

    // Get logs on mount and when refreshCount changes
    useEffect(() => {
        setLogs(getLogs(selectedCategory, 100));

        // Set up auto refresh
        let interval;
        if (autoRefresh) {
            interval = setInterval(() => {
                setRefreshCount(c => c + 1);
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [selectedCategory, refreshCount, autoRefresh]);

    // Refresh logs
    const handleRefresh = () => {
        setRefreshCount(c => c + 1);
    };

    // Clear logs
    const handleClear = () => {
        clearLogs();
        handleRefresh();
    };

    // Toggle a category
    const handleToggleCategory = (category) => {
        toggleLogging(category, true);
        setSelectedCategory(category);
        handleRefresh();
    };

    // Format data for display
    const formatData = (data) => {
        if (!data) return '';
        if (typeof data === 'string') return data;

        try {
            return JSON.stringify(data, null, 2);
        } catch (e) {
            return `[Error formatting data: ${e.message}]`;
        }
    };

    // Toggle debug panel
    const togglePanel = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            handleRefresh();
        }
    };

    // Enable debug mode
    const handleEnableDebug = () => {
        enableDebugMode();
        handleRefresh();
    };

    // Clear URL parameters
    const handleClearUrlParams = () => {
        window.history.replaceState({}, document.title, window.location.pathname);
        handleRefresh();
    };

    // Categories for filtering
    const categories = [
        { id: null, label: 'All Logs' },
        { id: 'modal', label: 'Modal' },
        { id: 'auth', label: 'Auth' },
        { id: 'api', label: 'API' },
        { id: 'error', label: 'Errors' },
        { id: 'general', label: 'General' }
    ];

    return (
        <div className="debug-panel">
            {/* Toggle button - always visible */}
            <button
                className="debug-toggle-button"
                onClick={togglePanel}
                title="Toggle Debug Panel"
            >
                🐞
            </button>

            {/* Debug panel - only visible when isOpen is true */}
            {isOpen && (
                <div className="debug-container">
                    <div className="debug-header">
                        <h3>Debug Panel</h3>
                        <div className="debug-controls">
                            <button onClick={handleRefresh} title="Refresh Logs">
                                🔄
                            </button>
                            <button onClick={handleClear} title="Clear Logs">
                                🗑️
                            </button>
                            <button onClick={handleEnableDebug} title="Enable Debug Mode">
                                🔧
                            </button>
                            <button onClick={handleClearUrlParams} title="Clear URL Parameters">
                                🧹
                            </button>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={autoRefresh}
                                    onChange={() => setAutoRefresh(!autoRefresh)}
                                />
                                Auto
                            </label>
                            <button onClick={() => setIsOpen(false)} title="Close">
                                ✖️
                            </button>
                        </div>
                    </div>

                    <div className="debug-categories">
                        {categories.map(category => (
                            <button
                                key={category.id || 'all'}
                                className={`category-button ${selectedCategory === category.id ? 'active' : ''}`}
                                onClick={() => handleToggleCategory(category.id)}
                            >
                                {category.label}
                            </button>
                        ))}
                    </div>

                    <div className="debug-log-container">
                        {logs.length === 0 ? (
                            <div className="debug-no-logs">No logs to display</div>
                        ) : (
                            logs.map((log, index) => (
                                <div
                                    key={index}
                                    className={`debug-log-entry debug-category-${log.category}`}
                                >
                                    <div className="debug-log-time">
                                        {new Date(log.time).toLocaleTimeString()}
                                    </div>
                                    <div className="debug-log-category">
                                        {log.category.toUpperCase()}
                                    </div>
                                    <div className="debug-log-message">
                                        {log.message}
                                    </div>
                                    {log.data && Object.keys(log.data).length > 0 && (
                                        <div className="debug-log-data">
                                            <pre>{formatData(log.data)}</pre>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    <div className="debug-footer">
                        <div className="debug-stats">
                            <span>Total Logs: {window.appLogs?.logs?.length || 0}</span>
                            <span>Displaying: {logs.length}</span>
                        </div>
                        <div className="debug-env">
                            Mode: {process.env.NODE_ENV}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Debug;
