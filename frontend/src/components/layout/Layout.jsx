import { Box } from '@mui/material';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import Header from './Header';

const Layout = ({ children }) => {
    const { isAuthenticated } = useSelector(state => state.auth);
    const location = useLocation();
    const isDashboard = location.pathname.startsWith('/dashboard');

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {!isDashboard && <Header />}

            <Box
                component="main"
                sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    ...(isAuthenticated && !isDashboard && {
                        mt: '64px',
                    }),
                }}
            >
                {children}
            </Box>
        </Box>
    );
};

export default Layout;
