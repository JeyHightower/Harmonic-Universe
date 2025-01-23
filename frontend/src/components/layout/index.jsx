import { Box, Container } from '@mui/material';
import Footer from '../Footer';
import Navbar from '../Navbar';

const Layout = ({ children }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      <Navbar />
      <Container
        component="main"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          py: 4,
        }}
      >
        {children}
      </Container>
      <Footer />
    </Box>
  );
};

export default Layout;
