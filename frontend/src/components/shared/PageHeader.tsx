import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import {
    Box,
    Breadcrumbs,
    Button,
    Link,
    Stack,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import React from 'react';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    breadcrumbs?: BreadcrumbItem[];
    action?: {
        label: string;
        onClick: () => void;
        icon?: React.ReactNode;
    };
}

const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    subtitle,
    breadcrumbs,
    action,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <Box
            sx={{
                mb: 4,
                pt: 2,
                pb: 1,
                borderBottom: 1,
                borderColor: 'divider',
            }}
        >
            {breadcrumbs && breadcrumbs.length > 0 && (
                <Breadcrumbs
                    separator={<NavigateNextIcon fontSize="small" />}
                    aria-label="breadcrumb"
                    sx={{ mb: 2 }}
                >
                    {breadcrumbs.map((item, index) => (
                        item.href ? (
                            <Link
                                key={index}
                                color="inherit"
                                href={item.href}
                                underline="hover"
                            >
                                {item.label}
                            </Link>
                        ) : (
                            <Typography
                                key={index}
                                color="text.primary"
                            >
                                {item.label}
                            </Typography>
                        )
                    ))}
                </Breadcrumbs>
            )}

            <Stack
                direction={isMobile ? 'column' : 'row'}
                justifyContent="space-between"
                alignItems={isMobile ? 'flex-start' : 'center'}
                spacing={2}
            >
                <Box>
                    <Typography
                        variant="h4"
                        component="h1"
                        gutterBottom={Boolean(subtitle)}
                    >
                        {title}
                    </Typography>
                    {subtitle && (
                        <Typography
                            variant="subtitle1"
                            color="text.secondary"
                        >
                            {subtitle}
                        </Typography>
                    )}
                </Box>

                {action && (
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={action.onClick}
                        startIcon={action.icon}
                    >
                        {action.label}
                    </Button>
                )}
            </Stack>
        </Box>
    );
};

export default PageHeader;
