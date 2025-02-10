import { CssBaseline, ThemeProvider as MuiThemeProvider } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext({
  mode: 'light',
  toggleTheme: () => {},
  theme: null,
});

const getTheme = mode => createTheme({
  palette: {
    mode,
    primary: {
      main: '#6B46C1',
      light: '#9F7AEA',
      dark: '#553C9A',
    },
    secondary: {
      main: '#38B2AC',
      light: '#4FD1C5',
      dark: '#2C7A7B',
    },
    background: {
      default: mode === 'light' ? '#F7FAFC' : '#1A202C',
      paper: mode === 'light' ? '#FFFFFF' : '#2D3748',
    },
    text: {
      primary: mode === 'light' ? '#2D3748' : '#FFFFFF',
      secondary: mode === 'light' ? '#4A5568' : '#A0AEC0',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: mode === 'light' ? '#F7FAFC' : '#1A202C',
          transition: 'background-color 0.3s ease',
        },
      },
    },
  },
});

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
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
