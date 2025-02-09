import MusicNoteIcon from '@mui/icons-material/MusicNote';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const Logo = ({ variant = 'default', sx = {} }) => {
  const theme = useTheme();

  const isSmall = variant === 'small';
  const iconSize = isSmall ? 24 : 32;
  const fontSize = isSmall ? '1.2rem' : '1.5rem';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        color: theme.palette.primary.main,
        ...sx,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: iconSize,
          height: iconSize,
          borderRadius: '50%',
          background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          color: '#fff',
        }}
      >
        <MusicNoteIcon sx={{ fontSize: isSmall ? 16 : 20 }} />
      </Box>
      <Typography
        variant="h6"
        component="span"
        sx={{
          fontSize,
          fontWeight: 700,
          background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.02em',
        }}
      >
        Harmonic Universe
      </Typography>
    </Box>
  );
};

export default Logo;
