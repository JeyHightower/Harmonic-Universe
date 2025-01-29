import EditIcon from '@mui/icons-material/Edit';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
    Box,
    Button,
    Card,
    CardContent,
    Container,
    Divider,
    Grid,
    IconButton,
    Paper,
    Tooltip,
    Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { useApi } from '../hooks/useApi';

const UniverseDetailsPage = () => {
  const { universeId } = useParams();
  const navigate = useNavigate();
  const api = useApi();
  const { user } = useAuthContext();
  const [universe, setUniverse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUniverse = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/universes/${universeId}`);
        setUniverse(response);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUniverse();
  }, [universeId, api]);

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  if (!universe) {
    return <Typography>Universe not found</Typography>;
  }

  const canEdit = user && universe.user_id === user.id;

  const renderParameterCard = (title, icon, parameters, description) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {icon}
          <Typography variant="h6" sx={{ ml: 1 }}>
            {title}
          </Typography>
          {canEdit && (
            <Tooltip title="Edit Parameters">
              <IconButton
                size="small"
                sx={{ ml: 'auto' }}
                onClick={() => navigate(`/universes/${universeId}/parameters`)}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        <Typography variant="body2" color="text.secondary" paragraph>
          {description}
        </Typography>
        <Box sx={{ mt: 2 }}>
          {Object.entries(parameters).map(([key, value]) => (
            <Box key={key} sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {key.replace(/_/g, ' ').toUpperCase()}
              </Typography>
              <Typography variant="body2">
                {typeof value === 'number'
                  ? value.toFixed(2)
                  : Array.isArray(value)
                  ? value.join(', ')
                  : value.toString()}
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {universe.name}
        </Typography>
        <Typography variant="body1" paragraph>
          {universe.description}
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h5" gutterBottom>
          Parameters
        </Typography>
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            {renderParameterCard(
              'Music Parameters',
              <MusicNoteIcon color="primary" />,
              universe.music_parameters,
              'Control the musical elements of your universe'
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            {renderParameterCard(
              'Visual Parameters',
              <VisibilityIcon color="primary" />,
              universe.visual_parameters,
              'Customize the visual appearance of your universe'
            )}
          </Grid>
        </Grid>

        {canEdit && (
          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              onClick={() => navigate(`/universes/${universeId}/parameters`)}
            >
              Edit Parameters
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default UniverseDetailsPage;

