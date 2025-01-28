import { createTheme, responsiveFontSizes } from '@mui/material/styles';

const baseTheme = {
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    subtitle1: {
      fontSize: '1.125rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.57,
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.57,
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 600,
      lineHeight: 1.75,
      textTransform: 'none',
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.66,
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 600,
      letterSpacing: '0.5px',
      lineHeight: 2.5,
      textTransform: 'uppercase',
    },
  },
  shape: {
    borderRadius: 8,
  },
  mixins: {
    toolbar: {
      minHeight: 64,
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
};

const darkTheme = {
  mode: 'dark',
  primary: {
    main: '#7C3AED',
    light: '#9F67FF',
    dark: '#5B21B6',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#10B981',
    light: '#34D399',
    dark: '#059669',
    contrastText: '#FFFFFF',
  },
  background: {
    default: '#0F172A',
    paper: '#1E293B',
    alternate: '#334155',
  },
  text: {
    primary: '#F1F5F9',
    secondary: '#94A3B8',
    disabled: '#64748B',
  },
  divider: '#334155',
  error: {
    main: '#EF4444',
    light: '#F87171',
    dark: '#DC2626',
    contrastText: '#FFFFFF',
  },
  warning: {
    main: '#F59E0B',
    light: '#FBBF24',
    dark: '#D97706',
    contrastText: '#FFFFFF',
  },
  info: {
    main: '#3B82F6',
    light: '#60A5FA',
    dark: '#2563EB',
    contrastText: '#FFFFFF',
  },
  success: {
    main: '#10B981',
    light: '#34D399',
    dark: '#059669',
    contrastText: '#FFFFFF',
  },
};

const lightTheme = {
  mode: 'light',
  primary: {
    main: '#6D28D9',
    light: '#8B5CF6',
    dark: '#5B21B6',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#059669',
    light: '#10B981',
    dark: '#047857',
    contrastText: '#FFFFFF',
  },
  background: {
    default: '#F8FAFC',
    paper: '#FFFFFF',
    alternate: '#F1F5F9',
  },
  text: {
    primary: '#1E293B',
    secondary: '#475569',
    disabled: '#94A3B8',
  },
  divider: '#E2E8F0',
  error: {
    main: '#DC2626',
    light: '#EF4444',
    dark: '#B91C1C',
    contrastText: '#FFFFFF',
  },
  warning: {
    main: '#D97706',
    light: '#F59E0B',
    dark: '#B45309',
    contrastText: '#FFFFFF',
  },
  info: {
    main: '#2563EB',
    light: '#3B82F6',
    dark: '#1D4ED8',
    contrastText: '#FFFFFF',
  },
  success: {
    main: '#059669',
    light: '#10B981',
    dark: '#047857',
    contrastText: '#FFFFFF',
  },
};

const palette = {
  mode: 'dark',
  primary: {
    main: '#4a90e2',
    light: '#64b5f6',
    dark: '#1976d2',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#50fa7b',
    light: '#69ff94',
    dark: '#00c853',
    contrastText: '#1a1a2e',
  },
  error: {
    main: '#ff5555',
    light: '#ff7777',
    dark: '#cc4444',
    contrastText: '#ffffff',
  },
  warning: {
    main: '#ffb86c',
    light: '#ffcc80',
    dark: '#ffa726',
    contrastText: '#1a1a2e',
  },
  info: {
    main: '#8be9fd',
    light: '#a4effd',
    dark: '#64d8f0',
    contrastText: '#1a1a2e',
  },
  success: {
    main: '#50fa7b',
    light: '#69ff94',
    dark: '#00c853',
    contrastText: '#1a1a2e',
  },
  neutral: {
    main: '#bd93f9',
    light: '#d6b7ff',
    dark: '#9580ff',
    contrastText: '#1a1a2e',
  },
};

export const getTheme = mode => {
  const selectedTheme = mode === 'light' ? lightTheme : darkTheme;
  const theme = createTheme({
    ...baseTheme,
    palette: {
      mode: selectedTheme.mode,
      ...selectedTheme,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
            padding: '8px 16px',
          },
          contained: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
    },
  });

  return responsiveFontSizes(theme);
};
