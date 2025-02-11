import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
    alpha,
    Box,
    CardActions,
    CardContent,
    CardHeader,
    CardMedia,
    IconButton,
    Card as MuiCard,
    Skeleton,
    useTheme
} from '@mui/material';
import React from 'react';

interface CardProps {
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    content?: React.ReactNode;
    media?: {
        src: string;
        alt: string;
        height?: number;
    };
    actions?: React.ReactNode;
    menu?: React.ReactNode;
    loading?: boolean;
    variant?: 'elevation' | 'outlined';
    elevation?: number;
    onClick?: () => void;
    sx?: Record<string, any>;
}

const Card: React.FC<CardProps> = ({
    title,
    subtitle,
    content,
    media,
    actions,
    menu,
    loading = false,
    variant = 'elevation',
    elevation = 1,
    onClick,
    sx = {},
}) => {
    const theme = useTheme();

    const cardContent = (
        <>
            <CardHeader
                title={
                    loading ? (
                        <Skeleton
                            animation="wave"
                            height={24}
                            width="80%"
                        />
                    ) : (
                        title
                    )
                }
                subheader={
                    loading ? (
                        <Skeleton
                            animation="wave"
                            height={20}
                            width="40%"
                        />
                    ) : (
                        subtitle
                    )
                }
                action={
                    menu && !loading && (
                        <IconButton aria-label="settings">
                            <MoreVertIcon />
                        </IconButton>
                    )
                }
            />
            {media && (
                <CardMedia
                    component="img"
                    height={media.height || 200}
                    image={loading ? undefined : media.src}
                    alt={media.alt}
                    sx={{
                        objectFit: 'cover',
                        ...(loading && {
                            bgcolor: theme.palette.action.hover,
                        }),
                    }}
                />
            )}
            {(content || loading) && (
                <CardContent>
                    {loading ? (
                        <Box sx={{ pt: 0.5 }}>
                            <Skeleton animation="wave" height={10} />
                            <Skeleton animation="wave" height={10} />
                            <Skeleton animation="wave" height={10} width="80%" />
                        </Box>
                    ) : (
                        content
                    )}
                </CardContent>
            )}
            {actions && !loading && (
                <CardActions sx={{ justifyContent: 'flex-end' }}>
                    {actions}
                </CardActions>
            )}
        </>
    );

    return (
        <MuiCard
            variant={variant}
            elevation={elevation}
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: theme.transitions.create(
                    ['box-shadow', 'transform', 'background-color'],
                    {
                        duration: theme.transitions.duration.shorter,
                    }
                ),
                ...(onClick && {
                    cursor: 'pointer',
                    '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[elevation + 2],
                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                    },
                }),
                ...sx,
            }}
            onClick={onClick}
        >
            {cardContent}
        </MuiCard>
    );
};

export default Card;
