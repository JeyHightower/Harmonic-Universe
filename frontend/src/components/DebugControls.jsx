import { BugOutlined, SettingOutlined } from '@ant-design/icons';
import { Button, Card, Space, Switch, Tooltip } from 'antd';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { MODAL_TYPES } from '../../constants/modalTypes';
import { useModal } from '../../contexts/ModalContext';
import './DebugControls.css';

/**
 * Debug Controls Panel - For testing modal and login functionality
 * Only shown in development or when debug mode is active
 */
const DebugControls = () => {
    const { openModal, closeAllModals } = useModal();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [visible, setVisible] = useState(false);
    const [logs, setLogs] = useState([]);
    const [expanded, setExpanded] = useState(false);
    const debug = useSelector(state => state.universe?.debug || false);

    // Handle direct modal testing
    const testLoginModal = () => {
        try {
            addLog('Opening LOGIN modal via ModalContext');
            closeAllModals();
            openModal(MODAL_TYPES.LOGIN);
        } catch (error) {
            addLog(`Error opening LOGIN modal: ${error.message}`);
        }
    };

    const testRegisterModal = () => {
        try {
            addLog('Opening REGISTER modal via ModalContext');
            closeAllModals();
            openModal(MODAL_TYPES.REGISTER);
        } catch (error) {
            addLog(`Error opening REGISTER modal: ${error.message}`);
        }
    };

    // Handle direct access modal testing
    const testDirectLoginModal = () => {
        try {
            addLog('Opening LOGIN modal via direct window function');
            if (window.openLoginModal) {
                window.openLoginModal();
            } else {
                addLog('window.openLoginModal function not found');
            }
        } catch (error) {
            addLog(`Error with direct login modal: ${error.message}`);
        }
    };

    const testDirectRegisterModal = () => {
        try {
            addLog('Opening REGISTER modal via direct window function');
            if (window.openRegisterModal) {
                window.openRegisterModal();
            } else {
                addLog('window.openRegisterModal function not found');
            }
        } catch (error) {
            addLog(`Error with direct register modal: ${error.message}`);
        }
    };

    // Handle demo login testing
    const testDemoLogin = () => {
        try {
            addLog('Testing demo login via button click');
            const demoButton = document.querySelector('.button-tertiary') ||
                document.getElementById('demo-button') ||
                document.getElementById('direct-demo-button');

            if (demoButton) {
                addLog(`Found demo button: ${demoButton.id || demoButton.className}`);
                demoButton.click();
            } else {
                addLog('Demo button not found in the DOM');
            }
        } catch (error) {
            addLog(`Error with demo login: ${error.message}`);
        }
    };

    // Handle direct demo login function
    const testDirectDemoLogin = () => {
        try {
            addLog('Testing demo login via global function');
            if (window.executeDemoLogin) {
                window.executeDemoLogin();
            } else if (window.demoLoginHandler) {
                window.demoLoginHandler();
            } else {
                addLog('No global demo login function found');
            }
        } catch (error) {
            addLog(`Error with direct demo login: ${error.message}`);
        }
    };

    // Test URL parameter navigation
    const testUrlNavigation = (path) => {
        try {
            addLog(`Navigating to: ${path}`);
            navigate(path);
        } catch (error) {
            addLog(`Navigation error: ${error.message}`);
        }
    };

    // Helper function to add logs
    const addLog = (message) => {
        const timestamp = new Date().toLocaleTimeString();
        const newLog = `[${timestamp}] ${message}`;

        console.log(newLog);

        setLogs(prevLogs => {
            const updatedLogs = [...prevLogs, newLog];
            // Keep only the last 20 logs
            if (updatedLogs.length > 20) {
                return updatedLogs.slice(-20);
            }
            return updatedLogs;
        });
    };

    // Check for environment and initialize visibility
    useEffect(() => {
        const isDevMode = process.env.NODE_ENV === 'development';
        const isDebugMode = window.debugMode || localStorage.getItem('debugMode') === 'true';

        setVisible(isDevMode || isDebugMode);

        if (isDevMode || isDebugMode) {
            addLog('Debug controls initialized');
            addLog(`Environment: ${process.env.NODE_ENV}`);
            addLog(`URL: ${window.location.href}`);
        }

        // Add global keyboard shortcut to toggle debug panel
        const handleKeyDown = (e) => {
            // Ctrl+Shift+D or Cmd+Shift+D
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'd') {
                e.preventDefault();
                setVisible(prev => !prev);
                localStorage.setItem('debugMode', (!visible).toString());
                window.debugMode = !visible;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [visible]);

    // Don't render if not visible
    if (!visible) return null;

    // Check for modal and auth state
    const checkState = () => {
        try {
            const modalState = window.modalDebug?.activeModals || [];
            const hasToken = !!localStorage.getItem('token') || !!localStorage.getItem('accessToken');

            addLog(`Auth token exists: ${hasToken}`);
            addLog(`Active modals: ${modalState.length}`);

            // Check modal DOM elements
            const modalRoot = document.getElementById('modal-root');
            const modalElements = document.querySelectorAll('.modal-content, .modal-backdrop');

            addLog(`Modal root exists: ${!!modalRoot}`);
            addLog(`Modal elements in DOM: ${modalElements.length}`);

            console.log('Debug State Check:', {
                modalState,
                hasToken,
                modalRoot,
                modalElements,
                location: window.location.href,
                localStorage: Object.keys(localStorage),
                debugLogs: window.debugLogs?.length || 0
            });
        } catch (error) {
            addLog(`Error checking state: ${error.message}`);
        }
    };

    // Check direct DOM access to app elements
    const checkDOM = () => {
        try {
            addLog('Checking DOM for key elements');

            const elements = [
                { name: 'Root', selector: '#root' },
                { name: 'Modal Root', selector: '#modal-root' },
                { name: 'Login Button', selector: '#login-button, .button-primary' },
                { name: 'Register Button', selector: '#register-button, .button-secondary' },
                { name: 'Demo Button', selector: '#demo-button, .button-tertiary' }
            ];

            elements.forEach(item => {
                const element = document.querySelector(item.selector);
                addLog(`${item.name}: ${element ? 'Found' : 'Not found'}`);
            });

            // Add event listener to login button if found
            const loginButton = document.querySelector('#login-button, .button-primary');
            if (loginButton && !loginButton._debugListenerAdded) {
                loginButton._debugListenerAdded = true;
                loginButton.addEventListener('click', () => {
                    addLog('Login button clicked via DOM listener');
                });
                addLog('Added debug listener to login button');
            }
        } catch (error) {
            addLog(`Error checking DOM: ${error.message}`);
        }
    };

    // Handle toggle of expanded view
    const toggleExpanded = () => {
        setExpanded(prev => !prev);
    };

    // Enable debug mode globally
    const enableDebugMode = () => {
        window.debugMode = true;
        localStorage.setItem('debugMode', 'true');
        addLog('Debug mode enabled globally');

        // Reload the page to apply debug mode
        if (!process.env.NODE_ENV === 'development') {
            window.location.reload();
        }
    };

    const toggleDebug = () => {
        dispatch({ type: 'universe/setDebug', payload: !debug });
    };

    return (
        <Card title="Debug Controls" size="small" style={{ marginBottom: '1rem' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
                <Space>
                    <Switch
                        checked={debug}
                        onChange={toggleDebug}
                        checkedChildren="Debug ON"
                        unCheckedChildren="Debug OFF"
                    />
                    <Tooltip title="Toggle debugging tools">
                        <BugOutlined />
                    </Tooltip>
                </Space>

                <Button
                    type="primary"
                    icon={<SettingOutlined />}
                    size="small"
                    disabled={!debug}
                >
                    Advanced Settings
                </Button>
            </Space>
        </Card>
    );
};

export default DebugControls;
