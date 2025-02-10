import { CssBaseline, ThemeProvider as MuiThemeProvider } from '@mui/material';
import { alpha, createTheme } from '@mui/material/styles';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext({
  mode: 'light',
  toggleTheme: () => {},
  theme: null,
});

const getTheme = mode => {
  // Define primary and secondary colors
  const primaryColor = {
    light: '#9F7AEA',
    main: '#6B46C1',
    dark: '#553C9A',
  };

  const secondaryColor = {
    light: '#4FD1C5',
    main: '#38B2AC',
    dark: '#2C7A7B',
  };

  // Define custom shadows
  const customShadows = {
    card: `0 2px 8px ${alpha(mode === 'light' ? '#000' : '#fff', 0.08)}`,
    modal: mode === 'light'
      ? '0 8px 32px rgba(0, 0, 0, 0.08)'
      : '0 8px 32px rgba(0, 0, 0, 0.32)',
    button: mode === 'light'
      ? '0 2px 4px rgba(0, 0, 0, 0.08)'
      : '0 2px 4px rgba(0, 0, 0, 0.16)',
  };

  // Create theme
  return createTheme({
    palette: {
      mode,
      primary: primaryColor,
      secondary: secondaryColor,
      background: {
        default: mode === 'light' ? '#F7FAFC' : '#1A202C',
        paper: mode === 'light' ? '#FFFFFF' : '#2D3748',
        modal: mode === 'light' ? '#FFFFFF' : '#2D3748',
      },
      text: {
        primary: mode === 'light' ? '#2D3748' : '#FFFFFF',
        secondary: mode === 'light' ? '#4A5568' : '#A0AEC0',
      },
      divider: mode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)',
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 600 },
      h2: { fontWeight: 600 },
      h3: { fontWeight: 600 },
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
    },
    shape: {
      borderRadius: 8,
    },
    customShadows,
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: mode === 'light' ? '#F7FAFC' : '#1A202C',
            transition: 'background-color 0.3s ease',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: customShadows.button,
            },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundImage: 'none',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            boxShadow: customShadows.card,
          },
        },
      },
    },
  });
};

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('theme-mode');
    return savedMode || 'light';
  });

  const theme = useMemo(() => getTheme(mode), [mode]);

  const toggleTheme = useCallback(() => {
    setMode(prevMode => {
      const newMode = prevMode === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme-mode', newMode);
      return newMode;
    });
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  const value = useMemo(
    () => ({
      mode,
      toggleTheme,
      theme,
    }),
    [mode, toggleTheme, theme]
  );

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
