import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1E4D8C', // Deep navy blue
      light: '#3A6FB4',
      dark: '#0D2F5C',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#34A29E', // Teal
      light: '#4DBDB9',
      dark: '#257B78',
      contrastText: '#ffffff',
    },
    accent: {
      main: '#F0B67F', // Warm orange
      light: '#F5C89D',
      dark: '#D99559',
    },
    background: {
      default: '#EDF2F7', // Slightly darker cool gray
      paper: '#FFFFFF',
      accent: '#E1E8F0', // Slightly darker blue-gray
    },
    text: {
      primary: '#1A2B42', // Dark blue-gray
      secondary: '#4A5567', // Medium blue-gray
    },
    error: {
      main: '#DC3545',
      light: '#E4606D',
      dark: '#B42A37',
    },
    warning: {
      main: '#F59E0B',
      light: '#F7B13F',
      dark: '#C47D08',
    },
    info: {
      main: '#3B82F6',
      light: '#60A5FA',
      dark: '#2563EB',
    },
    success: {
      main: '#10B981',
      light: '#34D399',
      dark: '#059669',
    },
    divider: 'rgba(0, 0, 0, 0.08)',
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
      letterSpacing: '-0.01em',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
      letterSpacing: '0.02em',
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.95rem',
          padding: '10px 24px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            transform: 'translateY(-2px)',
          },
          '&:active': {
            transform: 'translateY(1px)',
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background:
              'linear-gradient(120deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 70%)',
            transform: 'translateX(-100%)',
            transition: 'transform 0.8s',
          },
          '&:hover::before': {
            transform: 'translateX(100%)',
          },
        },
        contained: {
          background: `linear-gradient(135deg, #1E4D8C 0%, #34A29E 100%)`,
          boxShadow: '0 4px 12px rgba(30, 77, 140, 0.15)',
          '&:hover': {
            background: `linear-gradient(135deg, #1E4D8C 20%, #34A29E 120%)`,
            boxShadow: '0 6px 16px rgba(30, 77, 140, 0.25)',
          },
          '&:active': {
            boxShadow: '0 2px 8px rgba(30, 77, 140, 0.15)',
          },
        },
        outlined: {
          borderWidth: '2px',
          borderColor: '#1E4D8C',
          '&:hover': {
            borderWidth: '2px',
            background: 'rgba(30, 77, 140, 0.04)',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: '-2px',
            borderRadius: 'inherit',
            background: `linear-gradient(135deg, #1E4D8C 0%, #34A29E 100%)`,
            opacity: 0,
            transition: 'opacity 0.3s ease',
            zIndex: -1,
          },
          '&:hover::after': {
            opacity: 0.08,
          },
        },
        text: {
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '2px',
            background: `linear-gradient(90deg, #1E4D8C 0%, #34A29E 100%)`,
            transform: 'scaleX(0)',
            transformOrigin: 'right',
            transition: 'transform 0.3s ease',
          },
          '&:hover::after': {
            transform: 'scaleX(1)',
            transformOrigin: 'left',
          },
        },
        // Size variants
        sizeLarge: {
          padding: '12px 32px',
          fontSize: '1.1rem',
        },
        sizeSmall: {
          padding: '6px 16px',
          fontSize: '0.85rem',
          borderRadius: '8px',
        },
        // State styles
        disabled: {
          background: '#E5E7EB !important',
          color: '#9CA3AF !important',
          boxShadow: 'none !important',
          '&::before': {
            display: 'none',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        },
        elevation1: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          color: '#1A2B42',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid rgba(0,0,0,0.08)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#34A29E',
            },
          },
        },
      },
    },
  },
});

export default theme;
