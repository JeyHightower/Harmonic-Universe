import {
    Box,
    Breadcrumbs,
    Container,
    Link,
    Paper,
    Typography,
} from '@mui/material';
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import UniverseParametersEditor from '../components/UniverseParametersEditor';
import { useAuthContext } from '../contexts/AuthContext';

const UniverseParametersPage = () => {
  const { universeId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/universes/${universeId}/parameters` } });
    }
  }, [isAuthenticated, navigate, universeId]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link
            color="inherit"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate('/universes');
            }}
          >
            Universes
          </Link>
          <Link
            color="inherit"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate(`/universes/${universeId}`);
            }}
          >
            Universe Details
          </Link>
          <Typography color="text.primary">Parameters</Typography>
        </Breadcrumbs>
      </Box>

      <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Universe Parameters
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          Customize your universe's music and visual parameters
        </Typography>

        <UniverseParametersEditor universeId={universeId} />
      </Paper>
    </Container>
  );
};

export default UniverseParametersPage;
