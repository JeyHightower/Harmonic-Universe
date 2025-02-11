import {
    Alert,
    AlertColor,
    Snackbar,
    SnackbarOrigin,
} from '@mui/material';
import React from 'react';

interface ToastProps {
    open: boolean;
    message: string;
    severity?: AlertColor;
    autoHideDuration?: number;
    onClose: () => void;
    anchorOrigin?: SnackbarOrigin;
}

const Toast: React.FC<ToastProps> = ({
    open,
    message,
    severity = 'success',
    autoHideDuration = 6000,
    onClose,
    anchorOrigin = { vertical: 'bottom', horizontal: 'left' },
}) => {
    return (
        <Snackbar
            open={open}
            autoHideDuration={autoHideDuration}
            onClose={onClose}
            anchorOrigin={anchorOrigin}
        >
            <Alert
                onClose={onClose}
                severity={severity}
                variant="filled"
                sx={{ width: '100%' }}
                elevation={6}
            >
                {message}
            </Alert>
        </Snackbar>
    );
};

export default Toast;

// Context and hook for global toast management
import { createContext, useCallback, useContext, useState } from 'react';

interface ToastContextType {
    showToast: (message: string, options?: Partial<ToastProps>) => void;
    hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toastState, setToastState] = useState<ToastProps>({
        open: false,
        message: '',
        severity: 'success',
        autoHideDuration: 6000,
        onClose: () => { },
        anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
    });

    const showToast = useCallback((message: string, options?: Partial<ToastProps>) => {
        setToastState((prev) => ({
            ...prev,
            ...options,
            open: true,
            message,
        }));
    }, []);

    const hideToast = useCallback(() => {
        setToastState((prev) => ({
            ...prev,
            open: false,
        }));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, hideToast }}>
            {children}
            <Toast {...toastState} onClose={hideToast} />
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
