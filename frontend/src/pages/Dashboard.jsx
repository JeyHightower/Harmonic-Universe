import { createUniverse, deleteUniverse, fetchUniverses } from '@/store/slices/universeSlice';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated, token } = useSelector(state => state.auth);
  const { universes, loading, error: globalError } = useSelector(state => state.universe);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingUniverse, setEditingUniverse] = useState(null);
  const [formError, setFormError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: false,
  });

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      if (!isAuthenticated || !token) {
        navigate('/login');
        return;
      }

      try {
        await dispatch(fetchUniverses()).unwrap();
      } catch (err) {
        if (err.includes('log in')) {
          navigate('/login');
        }
      }
    };

    checkAuthAndFetchData();
  }, [dispatch, isAuthenticated, token, navigate]);

  const handleOpenDialog = universe => {
    setFormError(null);
    if (universe) {
      setEditingUniverse(universe);
      setFormData({
        name: universe.name,
        description: universe.description,
        isPublic: universe.isPublic,
      });
    } else {
      setEditingUniverse(null);
      setFormData({
        name: '',
        description: '',
        isPublic: false,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUniverse(null);
    setFormError(null);
    setFormData({
      name: '',
      description: '',
      isPublic: false,
    });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setFormError(null);

    // Client-side validation
    const name = formData.name.trim();
    const description = formData.description?.trim() || '';

    if (!name) {
      setFormError('Name is required');
      return;
    }

    if (name.length > 255) {
      setFormError('Name must be less than 255 characters');
      return;
    }

    if (description.length > 1000) {
      setFormError('Description must be less than 1000 characters');
      return;
    }

    try {
      const universeData = {
        name,
        description,
        isPublic: Boolean(formData.isPublic),
      };

      console.log('Submitting universe data:', universeData);

      const resultAction = await dispatch(createUniverse(universeData)).unwrap();

      if (resultAction) {
        handleCloseDialog();
        await dispatch(fetchUniverses()).unwrap();
      }
    } catch (err) {
      console.error('Failed to save universe:', err);

      // Handle login redirect
      if (typeof err === 'string' && err.includes('log in')) {
        navigate('/login');
        return;
      }

      // Display error message
      const errorMessage =
        err.response?.data?.detail || err.response?.data?.message || err.message || err;
      setFormError(errorMessage);

      // Log additional error details for debugging
      if (err.response) {
        console.error('Error Response:', {
          status: err.response.status,
          data: err.response.data,
          headers: err.response.headers,
        });
      }
    }
  };

  const handleDelete = async universeId => {
    if (window.confirm('Are you sure you want to delete this universe?')) {
      try {
        await dispatch(deleteUniverse(universeId)).unwrap();
      } catch (err) {
        console.error('Failed to delete universe:', err);
      }
    }
  };

  if (loading === 'pending') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          My Universes
        </Typography>
        <Button variant="contained" color="primary" onClick={() => handleOpenDialog()}>
          Create Universe
        </Button>
      </Box>

      {globalError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {globalError}
        </Alert>
      )}

      <Grid container spacing={3}>
        {universes.map(universe => (
          <Grid item xs={12} sm={6} md={4} key={universe.id}>
            <Paper
              sx={{
                p: 3,
                cursor: 'pointer',
                '&:hover': { boxShadow: 6 },
                position: 'relative',
              }}
              onClick={() => navigate(`/universe/${universe.id}`)}
            >
              <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                <IconButton
                  size="small"
                  onClick={e => {
                    e.stopPropagation();
                    handleOpenDialog(universe);
                  }}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={e => {
                    e.stopPropagation();
                    handleDelete(universe.id);
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
              <Typography variant="h6" gutterBottom>
                {universe.name}
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                {universe.description}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Created: {new Date(universe.createdAt).toLocaleDateString()}
              </Typography>
            </Paper>
          </Grid>
        ))}
        {universes.length === 0 && !loading && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No universes yet. Start by creating one!
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Universe</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {formError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formError}
              </Alert>
            )}
            <TextField
              autoFocus
              margin="dense"
              name="name"
              label="Universe Name"
              type="text"
              fullWidth
              required
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              error={!!formError && formError.includes('Name')}
              helperText={
                formError && formError.includes('Name')
                  ? formError
                  : 'Required, maximum 255 characters'
              }
              inputProps={{ maxLength: 255 }}
            />
            <TextField
              margin="dense"
              name="description"
              label="Description"
              type="text"
              fullWidth
              multiline
              rows={4}
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              error={!!formError && formError.includes('Description')}
              helperText={
                formError && formError.includes('Description')
                  ? formError
                  : 'Optional, maximum 1000 characters'
              }
              inputProps={{ maxLength: 1000 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={!formData.name.trim()}
            >
              Create
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default Dashboard;
