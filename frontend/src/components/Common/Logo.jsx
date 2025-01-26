import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';

const LogoContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const LogoIcon = styled('div')(({ theme }) => ({
  width: 40,
  height: 40,
  position: 'relative',
  '& svg': {
    width: '100%',
    height: '100%',
  },
}));

const LogoText = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.h1.fontFamily,
  fontWeight: 700,
  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  textShadow: '0 0 30px rgba(74, 144, 226, 0.3)',
}));

interface LogoProps {
  showText?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const Logo: React.FC<LogoProps> = ({ showText = true, size = 'medium' }) => {
  const sizes = {
    small: { icon: 24, text: 'h6' },
    medium: { icon: 40, text: 'h5' },
    large: { icon: 56, text: 'h4' },
  };

  return (
    <LogoContainer>
      <LogoIcon style={{ width: sizes[size].icon, height: sizes[size].icon }}>
        <svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Background Circle */}
          <circle cx="256" cy="256" r="248" fill="#1a1a2e" stroke="#4a90e2" strokeWidth="16"/>

          {/* Harmonic Waves */}
          <path
            d="M128 256 Q192 156 256 256 Q320 356 384 256"
            stroke="#50fa7b"
            strokeWidth="12"
            fill="none"
          >
            <animate
              attributeName="d"
              dur="4s"
              repeatCount="indefinite"
              values="
                M128 256 Q192 156 256 256 Q320 356 384 256;
                M128 256 Q192 356 256 256 Q320 156 384 256;
                M128 256 Q192 156 256 256 Q320 356 384 256"
            />
          </path>

          {/* Orbiting Particles */}
          <circle cx="256" cy="156" r="8" fill="#ff79c6">
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 256 256"
              to="360 256 256"
              dur="3s"
              repeatCount="indefinite"
            />
          </circle>

          <circle cx="256" cy="356" r="8" fill="#bd93f9">
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="180 256 256"
              to="540 256 256"
              dur="3s"
              repeatCount="indefinite"
            />
          </circle>

          {/* Central Core */}
          <circle cx="256" cy="256" r="24" fill="#f1fa8c">
            <animate
              attributeName="r"
              values="24;28;24"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
        </svg>
      </LogoIcon>
      {showText && (
        <LogoText variant={sizes[size].text as any}>
          Harmonic Universe
        </LogoText>
      )}
    </LogoContainer>
  );
};

export default Logo;
