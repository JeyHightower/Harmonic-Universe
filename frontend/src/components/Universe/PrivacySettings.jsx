import {
    Group,
    Lock,
    PersonAdd,
    Public,
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Chip,
    Divider,
    FormControlLabel,
    Switch,
    TextField,
    Typography,
    useTheme
} from '@mui/material';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { updateUniversePrivacy } from '../../store/slices/universeSlice';
import ModalForm from '../common/ModalForm';

const PrivacySettings = ({ open, onClose, universe }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState({
    is_public: universe?.is_public || false,
    allow_guests: universe?.allow_guests || false,
    collaborators: universe?.collaborators || [],
    viewers: universe?.viewers || [],
  });
  const [newCollaborator, setNewCollaborator] = useState('');
  const [newViewer, setNewViewer] = useState('');

  const handleSettingChange = (setting) => (event) => {
    setSettings(prev => ({
      ...prev,
      [setting]: event.target.checked,
    }));
  };

  const handleAddCollaborator = (event) => {
    event.preventDefault();
    if (newCollaborator && !settings.collaborators.includes(newCollaborator)) {
      setSettings(prev => ({
        ...prev,
        collaborators: [...prev.collaborators, newCollaborator],
      }));
      setNewCollaborator('');
    }
  };

  const handleRemoveCollaborator = (collaborator) => {
    setSettings(prev => ({
      ...prev,
      collaborators: prev.collaborators.filter(c => c !== collaborator),
    }));
  };

  const handleAddViewer = (event) => {
    event.preventDefault();
    if (newViewer && !settings.viewers.includes(newViewer)) {
      setSettings(prev => ({
        ...prev,
        viewers: [...prev.viewers, newViewer],
      }));
      setNewViewer('');
    }
  };

  const handleRemoveViewer = (viewer) => {
    setSettings(prev => ({
      ...prev,
      viewers: prev.viewers.filter(v => v !== viewer),
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      await dispatch(updateUniversePrivacy({
        universeId: universe.id,
        settings,
      })).unwrap();
      onClose();
    } catch (err) {
      setError('Failed to update privacy settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalForm
      open={open}
      onClose={onClose}
      title="Privacy Settings"
      onSubmit={handleSave}
      loading={loading}
      maxWidth="sm"
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <FormControlLabel
          control={
            <Switch
              checked={settings.is_public}
              onChange={handleSettingChange('is_public')}
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {settings.is_public ? <Public /> : <Lock />}
              <Typography>
                {settings.is_public ? 'Public Universe' : 'Private Universe'}
              </Typography>
            </Box>
          }
        />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 4 }}>
          {settings.is_public
            ? 'Anyone can view this universe'
            : 'Only specified users can view this universe'}
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ mb: 3 }}>
        <FormControlLabel
          control={
            <Switch
              checked={settings.allow_guests}
              onChange={handleSettingChange('allow_guests')}
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Group />
              <Typography>Allow Guest Access</Typography>
            </Box>
          }
        />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 4 }}>
          Guests can view and interact but cannot modify parameters
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Collaborators
        </Typography>
        <Box
          component="form"
          onSubmit={handleAddCollaborator}
          sx={{ display: 'flex', gap: 1, mb: 2 }}
        >
          <TextField
            size="small"
            placeholder="Add collaborator by email"
            value={newCollaborator}
            onChange={(e) => setNewCollaborator(e.target.value)}
            fullWidth
          />
          <PersonAdd
            onClick={handleAddCollaborator}
            sx={{
              cursor: 'pointer',
              color: theme.palette.primary.main,
              '&:hover': { color: theme.palette.primary.dark },
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {settings.collaborators.map((collaborator) => (
            <Chip
              key={collaborator}
              label={collaborator}
              onDelete={() => handleRemoveCollaborator(collaborator)}
              sx={{ mb: 1 }}
            />
          ))}
        </Box>
      </Box>

      <Box>
        <Typography variant="subtitle1" gutterBottom>
          Viewers
        </Typography>
        <Box
          component="form"
          onSubmit={handleAddViewer}
          sx={{ display: 'flex', gap: 1, mb: 2 }}
        >
          <TextField
            size="small"
            placeholder="Add viewer by email"
            value={newViewer}
            onChange={(e) => setNewViewer(e.target.value)}
            fullWidth
          />
          <PersonAdd
            onClick={handleAddViewer}
            sx={{
              cursor: 'pointer',
              color: theme.palette.primary.main,
              '&:hover': { color: theme.palette.primary.dark },
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {settings.viewers.map((viewer) => (
            <Chip
              key={viewer}
              label={viewer}
              onDelete={() => handleRemoveViewer(viewer)}
              sx={{ mb: 1 }}
            />
          ))}
        </Box>
      </Box>
    </ModalForm>
  );
};

export default PrivacySettings;
