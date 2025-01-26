import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';
import React from 'react';
import { Link } from 'react-router-dom';

const LogoContainer = styled(Link)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    textDecoration: 'none',
    color: theme.palette.text.primary
}));

const LogoIcon = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: '50%',
    backgroundColor: theme.palette.primary.main,
    marginRight: theme.spacing(1)
}));

const LogoText = styled(Typography)(({ theme }) => ({
    fontWeight: 700,
    fontSize: '1.5rem',
    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
}));

const Logo = ({ showText = true, size = 'medium' }) => {
    const dimensions = {
        small: { icon: 32, fontSize: '1.25rem' },
        medium: { icon: 40, fontSize: '1.5rem' },
        large: { icon: 48, fontSize: '1.75rem' }
    };

    return (
        <LogoContainer to="/">
            <LogoIcon
                sx={{
                    width: dimensions[size].icon,
                    height: dimensions[size].icon
                }}
            >
                <svg
                    width={dimensions[size].icon * 0.6}
                    height={dimensions[size].icon * 0.6}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5.5-2.5l7.51-3.49L17.5 6.5 9.99 9.99 6.5 17.5zm5.5-6.6c.61 0 1.1.49 1.1 1.1s-.49 1.1-1.1 1.1-1.1-.49-1.1-1.1.49-1.1 1.1-1.1z"
                        fill="currentColor"
                    />
                </svg>
            </LogoIcon>
            {showText && (
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <LogoText
                        variant="h6"
                        sx={{ fontSize: dimensions[size].fontSize }}
                    >
                        Harmonic
                    </LogoText>
                    <Typography
                        variant="caption"
                        sx={{
                            opacity: 0.7,
                            fontSize: `calc(${dimensions[size].fontSize} * 0.5)`
                        }}
                    >
                        Universe
                    </Typography>
                </Box>
            )}
        </LogoContainer>
    );
};

Logo.propTypes = {
    showText: PropTypes.bool,
    size: PropTypes.oneOf(['small', 'medium', 'large'])
};

export default Logo;
