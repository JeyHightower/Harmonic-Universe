import { Box } from '@mui/material';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import Header from './Header';

const Layout = ({ children }) => {
    const { isAuthenticated, loading } = useSelector(state => state.auth);
    const location = useLocation();

    // Determine page type
    const isDashboard = location.pathname.startsWith('/dashboard');
    const isAuthPage = ['/login', '/register', '/reset-password', '/verify-email'].includes(location.pathname);
    const isHomePage = location.pathname === '/';

    // Show header logic
    const showHeader = !isDashboard && !isAuthPage && !loading;

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                bgcolor: 'background.default'
            }}
        >
            {showHeader && <Header />}

            <Box
                component="main"
                sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    ...(showHeader && {
                        mt: '64px', // Header height
                    }),
                    ...(isDashboard && {
                        ml: { sm: '240px' }, // Sidebar width
                    }),
                }}
            >
                {children}
            </Box>
        </Box>
    );
};

export default Layout;
