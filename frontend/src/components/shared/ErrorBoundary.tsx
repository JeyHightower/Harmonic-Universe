import RefreshIcon from '@mui/icons-material/Refresh';
import {
    Box,
    Button,
    Container,
    Paper,
    Typography,
} from '@mui/material';
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
            errorInfo: null,
        };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({
            error,
            errorInfo,
        });

        // Log error to your error reporting service
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <Container maxWidth="sm">
                    <Paper
                        sx={{
                            p: 4,
                            mt: 4,
                            textAlign: 'center',
                            borderRadius: 2,
                            boxShadow: 3,
                        }}
                    >
                        <Typography variant="h5" gutterBottom color="error">
                            Something went wrong
                        </Typography>
                        <Typography variant="body1" color="textSecondary" paragraph>
                            {this.state.error?.message || 'An unexpected error occurred'}
                        </Typography>
                        {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                            <Box
                                component="pre"
                                sx={{
                                    mt: 2,
                                    p: 2,
                                    bgcolor: 'grey.100',
                                    borderRadius: 1,
                                    overflow: 'auto',
                                    textAlign: 'left',
                                    fontSize: '0.875rem',
                                }}
                            >
                                <code>
                                    {this.state.error?.stack}
                                    {'\n\nComponent Stack:\n'}
                                    {this.state.errorInfo.componentStack}
                                </code>
                            </Box>
                        )}
                        <Button
                            variant="contained"
                            startIcon={<RefreshIcon />}
                            onClick={this.handleReset}
                            sx={{ mt: 3 }}
                        >
                            Try Again
                        </Button>
                    </Paper>
                </Container>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
