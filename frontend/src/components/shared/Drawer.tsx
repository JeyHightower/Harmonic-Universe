import CloseIcon from '@mui/icons-material/Close';
import {
    Box,
    Divider,
    IconButton,
    Drawer as MuiDrawer,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import React from 'react';

interface DrawerProps {
    open: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    children: React.ReactNode;
    anchor?: 'left' | 'right' | 'top' | 'bottom';
    width?: number | string;
    height?: number | string;
    hideCloseButton?: boolean;
    variant?: 'temporary' | 'persistent' | 'permanent';
    elevation?: number;
    sx?: Record<string, any>;
}

const Drawer: React.FC<DrawerProps> = ({
    open,
    onClose,
    title,
    children,
    anchor = 'right',
    width = 400,
    height = '100%',
    hideCloseButton = false,
    variant = 'temporary',
    elevation = 1,
    sx = {},
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const isVertical = anchor === 'left' || anchor === 'right';
    const drawerWidth = isVertical ? width : '100%';
    const drawerHeight = isVertical ? '100%' : height;

    return (
        <MuiDrawer
            anchor={anchor}
            open={open}
            onClose={onClose}
            variant={variant}
            elevation={elevation}
            sx={{
                '& .MuiDrawer-paper': {
                    width: drawerWidth,
                    height: drawerHeight,
                    maxWidth: '100%',
                    maxHeight: '100%',
                    ...sx,
                },
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                }}
            >
                {(title || !hideCloseButton) && (
                    <>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                p: 2,
                                minHeight: 64,
                            }}
                        >
                            {title && (
                                <Typography variant="h6" component="div">
                                    {title}
                                </Typography>
                            )}
                            {!hideCloseButton && (
                                <IconButton
                                    edge="end"
                                    color="inherit"
                                    onClick={onClose}
                                    aria-label="close"
                                    sx={{
                                        ...(title ? { ml: 2 } : { ml: 'auto' }),
                                    }}
                                >
                                    <CloseIcon />
                                </IconButton>
                            )}
                        </Box>
                        <Divider />
                    </>
                )}
                <Box
                    sx={{
                        flex: 1,
                        overflow: 'auto',
                        p: 2,
                    }}
                >
                    {children}
                </Box>
            </Box>
        </MuiDrawer>
    );
};

export default Drawer;
