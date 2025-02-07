import {
    Dashboard,
    MusicNote,
    Psychology,
    Science,
    Settings,
    Visibility,
} from '@mui/icons-material';
import {
    Divider,
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    useTheme,
} from '@mui/material';
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const drawerWidth = 240;

const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Audio Studio', icon: <MusicNote />, path: '/audio' },
    { text: 'Physics Lab', icon: <Science />, path: '/physics' },
    { text: 'Visualization', icon: <Visibility />, path: '/visualization' },
    { text: 'AI Studio', icon: <Psychology />, path: '/ai' },
    { text: 'Settings', icon: <Settings />, path: '/settings' },
];

const Sidebar: React.FC = () => {
    const theme = useTheme();
    const location = useLocation();
    const navigate = useNavigate();

    const handleNavigation = (path: string) => {
        navigate(path);
    };

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                [`& .MuiDrawer-paper`]: {
                    width: drawerWidth,
                    boxSizing: 'border-box',
                    backgroundColor: theme.palette.background.default,
                    borderRight: `1px solid ${theme.palette.divider}`,
                },
            }}
        >
            <List sx={{ mt: '64px' }}>
                {menuItems.map((item, index) => (
                    <React.Fragment key={item.text}>
                        {index === menuItems.length - 1 && <Divider sx={{ my: 1 }} />}
                        <ListItem
                            button
                            onClick={() => handleNavigation(item.path)}
                            selected={location.pathname === item.path}
                            sx={{
                                '&.Mui-selected': {
                                    backgroundColor: theme.palette.action.selected,
                                    '&:hover': {
                                        backgroundColor: theme.palette.action.hover,
                                    },
                                },
                            }}
                        >
                            <ListItemIcon
                                sx={{
                                    color: location.pathname === item.path
                                        ? theme.palette.primary.main
                                        : theme.palette.text.secondary,
                                }}
                            >
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText
                                primary={item.text}
                                sx={{
                                    '& .MuiTypography-root': {
                                        color: location.pathname === item.path
                                            ? theme.palette.primary.main
                                            : theme.palette.text.primary,
                                    },
                                }}
                            />
                        </ListItem>
                    </React.Fragment>
                ))}
            </List>
        </Drawer>
    );
};

export default Sidebar;
