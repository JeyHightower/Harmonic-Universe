import {
    Avatar,
    Divider,
    ListItem,
    ListItemAvatar,
    ListItemButton,
    ListItemIcon,
    ListItemSecondaryAction,
    ListItemText,
    List as MuiList,
    Skeleton,
    useTheme
} from '@mui/material';
import React from 'react';

interface ListItemData {
    id: string | number;
    primary: React.ReactNode;
    secondary?: React.ReactNode;
    icon?: React.ReactNode;
    avatar?: string | React.ReactNode;
    action?: React.ReactNode;
    disabled?: boolean;
}

interface ListProps {
    items: ListItemData[];
    loading?: boolean;
    loadingRows?: number;
    dense?: boolean;
    divider?: boolean;
    onClick?: (item: ListItemData) => void;
    selected?: string | number;
    sx?: Record<string, any>;
}

const List: React.FC<ListProps> = ({
    items,
    loading = false,
    loadingRows = 3,
    dense = false,
    divider = false,
    onClick,
    selected,
    sx = {},
}) => {
    const theme = useTheme();

    const renderLoadingSkeleton = () => {
        return Array.from({ length: loadingRows }).map((_, index) => (
            <React.Fragment key={index}>
                <ListItem dense={dense}>
                    {items.some((item) => item.avatar) && (
                        <ListItemAvatar>
                            <Skeleton
                                variant="circular"
                                width={40}
                                height={40}
                            />
                        </ListItemAvatar>
                    )}
                    {items.some((item) => item.icon) && (
                        <ListItemIcon>
                            <Skeleton
                                variant="circular"
                                width={24}
                                height={24}
                            />
                        </ListItemIcon>
                    )}
                    <ListItemText
                        primary={
                            <Skeleton
                                animation="wave"
                                height={20}
                                width="80%"
                                style={{ marginBottom: 6 }}
                            />
                        }
                        secondary={
                            <Skeleton
                                animation="wave"
                                height={16}
                                width="40%"
                            />
                        }
                    />
                    {items.some((item) => item.action) && (
                        <ListItemSecondaryAction>
                            <Skeleton
                                variant="circular"
                                width={32}
                                height={32}
                            />
                        </ListItemSecondaryAction>
                    )}
                </ListItem>
                {divider && index < loadingRows - 1 && <Divider />}
            </React.Fragment>
        ));
    };

    const renderItem = (item: ListItemData) => {
        const isSelected = selected !== undefined && item.id === selected;
        const ItemComponent = onClick ? ListItemButton : ListItem;

        return (
            <React.Fragment key={item.id}>
                <ItemComponent
                    dense={dense}
                    onClick={() => onClick?.(item)}
                    selected={isSelected}
                    disabled={item.disabled}
                >
                    {item.avatar && (
                        <ListItemAvatar>
                            {typeof item.avatar === 'string' ? (
                                <Avatar src={item.avatar} />
                            ) : (
                                item.avatar
                            )}
                        </ListItemAvatar>
                    )}
                    {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
                    <ListItemText
                        primary={item.primary}
                        secondary={item.secondary}
                        primaryTypographyProps={{
                            variant: dense ? 'body2' : 'body1',
                        }}
                        secondaryTypographyProps={{
                            variant: dense ? 'caption' : 'body2',
                        }}
                    />
                    {item.action && (
                        <ListItemSecondaryAction>
                            {item.action}
                        </ListItemSecondaryAction>
                    )}
                </ItemComponent>
                {divider && <Divider />}
            </React.Fragment>
        );
    };

    return (
        <MuiList sx={sx}>
            {loading ? renderLoadingSkeleton() : items.map(renderItem)}
        </MuiList>
    );
};

export default List;
