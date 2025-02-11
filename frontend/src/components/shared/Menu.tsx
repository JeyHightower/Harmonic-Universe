import {
    alpha,
    Divider,
    ListItemIcon,
    ListItemText,
    MenuItem,
    Menu as MuiMenu,
    Typography,
    useTheme,
} from '@mui/material';
import React from 'react';

interface MenuItemData {
    id: string | number;
    label: string;
    icon?: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    divider?: boolean;
    danger?: boolean;
}

interface MenuProps {
    anchorEl: HTMLElement | null;
    open: boolean;
    onClose: () => void;
    items: MenuItemData[];
    maxWidth?: number | string;
    minWidth?: number | string;
    elevation?: number;
    transformOrigin?: {
        vertical: number | 'top' | 'center' | 'bottom';
        horizontal: number | 'left' | 'center' | 'right';
    };
    anchorOrigin?: {
        vertical: number | 'top' | 'center' | 'bottom';
        horizontal: number | 'left' | 'center' | 'right';
    };
}

const Menu: React.FC<MenuProps> = ({
    anchorEl,
    open,
    onClose,
    items,
    maxWidth = 'auto',
    minWidth = 200,
    elevation = 8,
    transformOrigin = {
        vertical: 'top',
        horizontal: 'right',
    },
    anchorOrigin = {
        vertical: 'bottom',
        horizontal: 'right',
    },
}) => {
    const theme = useTheme();

    return (
        <MuiMenu
            anchorEl={anchorEl}
            open={open}
            onClose={onClose}
            elevation={elevation}
            transformOrigin={transformOrigin}
            anchorOrigin={anchorOrigin}
            sx={{
                '& .MuiPaper-root': {
                    maxWidth,
                    minWidth,
                    mt: 1,
                    '& .MuiList-root': {
                        py: 0.5,
                    },
                },
            }}
        >
            {items.map((item, index) => (
                <React.Fragment key={item.id}>
                    <MenuItem
                        onClick={() => {
                            item.onClick?.();
                            onClose();
                        }}
                        disabled={item.disabled}
                        sx={{
                            py: 1,
                            px: 2,
                            ...(item.danger && {
                                color: theme.palette.error.main,
                                '&:hover': {
                                    backgroundColor: alpha(theme.palette.error.main, 0.08),
                                },
                            }),
                        }}
                    >
                        {item.icon && (
                            <ListItemIcon
                                sx={{
                                    color: item.danger ? 'error.main' : 'inherit',
                                    minWidth: 36,
                                }}
                            >
                                {item.icon}
                            </ListItemIcon>
                        )}
                        <ListItemText
                            primary={
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontWeight: item.danger ? 500 : 400,
                                    }}
                                >
                                    {item.label}
                                </Typography>
                            }
                        />
                    </MenuItem>
                    {item.divider && index < items.length - 1 && (
                        <Divider sx={{ my: 0.5 }} />
                    )}
                </React.Fragment>
            ))}
        </MuiMenu>
    );
};

export default Menu;
