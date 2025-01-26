import { createTheme } from "@mui/material/styles";

// Define color palette
const colors = {
  primary: {
    main: "#4a90e2",
    light: "#7bb3ff",
    dark: "#0061af",
    contrastText: "#ffffff",
  },
  secondary: {
    main: "#6c63ff",
    light: "#9f94ff",
    dark: "#3634cb",
    contrastText: "#ffffff",
  },
  error: {
    main: "#ff4d4d",
    light: "#ff8080",
    dark: "#cc0000",
    contrastText: "#ffffff",
  },
  warning: {
    main: "#ffb84d",
    light: "#ffcc80",
    dark: "#cc8800",
    contrastText: "#000000",
  },
  info: {
    main: "#4dd0e1",
    light: "#80deea",
    dark: "#0097a7",
    contrastText: "#000000",
  },
  success: {
    main: "#66bb6a",
    light: "#98ee99",
    dark: "#338a3e",
    contrastText: "#000000",
  },
  background: {
    default: "#121212",
    paper: "#1e1e1e",
  },
  text: {
    primary: "#ffffff",
    secondary: "rgba(255, 255, 255, 0.7)",
    disabled: "rgba(255, 255, 255, 0.5)",
  },
};

// Create theme
export const theme = createTheme({
  palette: {
    mode: "dark",
    ...colors,
  },
  typography: {
    fontFamily: [
      "Inter",
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      '"Helvetica Neue"',
      "Arial",
      "sans-serif",
    ].join(","),
    h1: {
      fontSize: "2.5rem",
      fontWeight: 700,
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 600,
    },
    h3: {
      fontSize: "1.75rem",
      fontWeight: 600,
    },
    h4: {
      fontSize: "1.5rem",
      fontWeight: 600,
    },
    h5: {
      fontSize: "1.25rem",
      fontWeight: 500,
    },
    h6: {
      fontSize: "1rem",
      fontWeight: 500,
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.5,
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.43,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 8,
          padding: "8px 16px",
        },
        contained: {
          boxShadow: "none",
          "&:hover": {
            boxShadow: "none",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.15)",
        },
      },
    },
  },
});
