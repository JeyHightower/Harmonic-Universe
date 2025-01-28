import { alpha, createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#4a90e2',
            light: '#7cb3ff',
            dark: '#1565af',
            contrastText: '#ffffff'
        },
        secondary: {
            main: '#50fa7b',
            light: '#83ff9e',
            dark: '#00c64a',
            contrastText: '#000000'
        },
        error: {
            main: '#ff5555',
            light: '#ff8787',
            dark: '#c51e3a',
            contrastText: '#ffffff'
        },
        warning: {
            main: '#ffb86c',
            light: '#ffd699',
            dark: '#cc8c43',
            contrastText: '#000000'
        },
        info: {
            main: '#8be9fd',
            light: '#b3f0fe',
            dark: '#5fb9ca',
            contrastText: '#000000'
        },
        success: {
            main: '#50fa7b',
            light: '#83ff9e',
            dark: '#00c64a',
            contrastText: '#000000'
        },
        background: {
            default: '#1a1a2e',
            paper: '#282a36',
            dark: '#141422'
        },
        text: {
            primary: '#f8f8f2',
            secondary: alpha('#f8f8f2', 0.7),
            disabled: alpha('#f8f8f2', 0.5)
        },
        divider: alpha('#f8f8f2', 0.12)
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            fontWeight: 700,
            fontSize: '3.5rem'
        },
        h2: {
            fontWeight: 700,
            fontSize: '3rem'
        },
        h3: {
            fontWeight: 700,
            fontSize: '2.5rem'
        },
        h4: {
            fontWeight: 700,
            fontSize: '2rem'
        },
        h5: {
            fontWeight: 600,
            fontSize: '1.5rem'
        },
        h6: {
            fontWeight: 600,
            fontSize: '1.25rem'
        },
        subtitle1: {
            fontSize: '1.125rem',
            fontWeight: 500
        },
        subtitle2: {
            fontSize: '1rem',
            fontWeight: 500
        },
        body1: {
            fontSize: '1rem',
            lineHeight: 1.5
        },
        body2: {
            fontSize: '0.875rem',
            lineHeight: 1.57
        },
        button: {
            fontWeight: 600,
            textTransform: 'none'
        },
        caption: {
            fontSize: '0.75rem',
            fontWeight: 400
        },
        overline: {
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
        }
    },
    shape: {
        borderRadius: 8
    },
    shadows: [
        'none',
        '0px 2px 4px rgba(0, 0, 0, 0.2)',
        '0px 4px 8px rgba(0, 0, 0, 0.2)',
        '0px 8px 16px rgba(0, 0, 0, 0.2)',
        '0px 12px 24px rgba(0, 0, 0, 0.2)',
        '0px 16px 32px rgba(0, 0, 0, 0.2)',
        '0px 20px 40px rgba(0, 0, 0, 0.2)',
        '0px 24px 48px rgba(0, 0, 0, 0.2)',
        '0px 28px 56px rgba(0, 0, 0, 0.2)',
        '0px 32px 64px rgba(0, 0, 0, 0.2)',
        '0px 36px 72px rgba(0, 0, 0, 0.2)',
        '0px 40px 80px rgba(0, 0, 0, 0.2)',
        '0px 44px 88px rgba(0, 0, 0, 0.2)',
        '0px 48px 96px rgba(0, 0, 0, 0.2)',
        '0px 52px 104px rgba(0, 0, 0, 0.2)',
        '0px 56px 112px rgba(0, 0, 0, 0.2)',
        '0px 60px 120px rgba(0, 0, 0, 0.2)',
        '0px 64px 128px rgba(0, 0, 0, 0.2)',
        '0px 68px 136px rgba(0, 0, 0, 0.2)',
        '0px 72px 144px rgba(0, 0, 0, 0.2)',
        '0px 76px 152px rgba(0, 0, 0, 0.2)',
        '0px 80px 160px rgba(0, 0, 0, 0.2)',
        '0px 84px 168px rgba(0, 0, 0, 0.2)',
        '0px 88px 176px rgba(0, 0, 0, 0.2)',
        '0px 92px 184px rgba(0, 0, 0, 0.2)'
    ],
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    textTransform: 'none',
                    fontWeight: 600
                },
                contained: {
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: 'none'
                    }
                },
                outlined: {
                    '&:hover': {
                        backgroundColor: alpha('#4a90e2', 0.04)
                    }
                }
            }
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    backgroundImage: 'none'
                }
            }
        },
        MuiCardContent: {
            styleOverrides: {
                root: {
                    padding: '32px 24px',
                    '&:last-child': {
                        paddingBottom: '32px'
                    }
                }
            }
        },
        MuiCardHeader: {
            defaultProps: {
                titleTypographyProps: {
                    variant: 'h6'
                },
                subheaderTypographyProps: {
                    variant: 'body2'
                }
            },
            styleOverrides: {
                root: {
                    padding: '32px 24px 16px'
                }
            }
        },
        MuiCssBaseline: {
            styleOverrides: {
                '*': {
                    boxSizing: 'border-box',
                    margin: 0,
                    padding: 0
                },
                html: {
                    MozOsxFontSmoothing: 'grayscale',
                    WebkitFontSmoothing: 'antialiased',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: '100%',
                    width: '100%'
                },
                body: {
                    display: 'flex',
                    flex: '1 1 auto',
                    flexDirection: 'column',
                    minHeight: '100%',
                    width: '100%'
                },
                '#root': {
                    display: 'flex',
                    flex: '1 1 auto',
                    flexDirection: 'column',
                    height: '100%',
                    width: '100%'
                }
            }
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    borderRadius: 8
                }
            }
        },
        MuiTableHead: {
            styleOverrides: {
                root: {
                    backgroundColor: alpha('#4a90e2', 0.04),
                    '.MuiTableCell-root': {
                        color: '#f8f8f2',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        lineHeight: 1.57
                    }
                }
            }
        }
    }
});

export default theme;
