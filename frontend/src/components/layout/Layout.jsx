import { Box, Container } from '@mui/material';
import Header from './Header';

const Layout = ({ children }) => {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Header />
            <Container component="main" sx={{ flex: 1, py: 4 }}>
                {children}
            </Container>
        </Box>
    );
};

export default Layout;
