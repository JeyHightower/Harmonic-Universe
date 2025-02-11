import {
    Box,
    Button,
    SvgIcon,
    Typography,
    useTheme,
} from '@mui/material';
import React from 'react';

interface EmptyStateProps {
    title: string;
    message: string;
    icon?: React.ComponentType;
    action?: {
        label: string;
        onClick: () => void;
    };
    maxWidth?: number | string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
    title,
    message,
    icon: Icon,
    action,
    maxWidth = 400,
}) => {
    const theme = useTheme();

    return (
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            py={6}
            px={3}
            sx={{
                maxWidth: maxWidth,
                margin: '0 auto',
            }}
        >
            {Icon && (
                <SvgIcon
                    component={Icon}
                    sx={{
                        fontSize: 64,
                        color: theme.palette.action.disabled,
                        mb: 2,
                    }}
                />
            )}
            <Typography
                variant="h6"
                color="textPrimary"
                gutterBottom
            >
                {title}
            </Typography>
            <Typography
                variant="body2"
                color="textSecondary"
                sx={{ mb: action ? 3 : 0 }}
            >
                {message}
            </Typography>
            {action && (
                <Button
                    variant="contained"
                    color="primary"
                    onClick={action.onClick}
                    sx={{ mt: 2 }}
                >
                    {action.label}
                </Button>
            )}
        </Box>
    );
};

export default EmptyState;
