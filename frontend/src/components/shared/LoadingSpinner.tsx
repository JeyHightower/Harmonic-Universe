import {
    Box,
    CircularProgress,
    Typography,
    useTheme,
} from '@mui/material';
import React from 'react';

interface LoadingSpinnerProps {
    size?: number;
    message?: string;
    variant?: 'fullscreen' | 'inline' | 'overlay';
    color?: 'primary' | 'secondary' | 'inherit';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 40,
    message = 'Loading...',
    variant = 'inline',
    color = 'primary',
}) => {
    const theme = useTheme();

    const renderSpinner = () => (
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            gap={2}
        >
            <CircularProgress size={size} color={color} />
            {message && (
                <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ mt: 1 }}
                >
                    {message}
                </Typography>
            )}
        </Box>
    );

    if (variant === 'fullscreen') {
        return (
            <Box
                sx={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    bgcolor: 'background.default',
                    zIndex: theme.zIndex.modal + 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {renderSpinner()}
            </Box>
        );
    }

    if (variant === 'overlay') {
        return (
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    bgcolor: 'rgba(255, 255, 255, 0.8)',
                    zIndex: theme.zIndex.modal,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {renderSpinner()}
            </Box>
        );
    }

    return renderSpinner();
};

export default LoadingSpinner;
