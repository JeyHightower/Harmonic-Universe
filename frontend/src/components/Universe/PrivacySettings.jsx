import {
  Lock as LockIcon,
  Public as PublicIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import {
  Box,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Radio,
  RadioGroup,
  Switch,
  Typography,
} from '@mui/material';
import Button from '@mui/material/Button';
import { useState } from 'react';
import { universeService } from '../../services/universeService';

const PrivacySettings = ({ universe, onUpdate }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState({
    visibility: universe.is_public ? 'public' : 'private',
    allowGuests: universe.allow_guests || false,
    collaboratorPermissions: {
      canEdit: universe.collaborator_permissions?.canEdit || false,
      canInvite: universe.collaborator_permissions?.canInvite || false,
      canManageAccess:
        universe.collaborator_permissions?.canManageAccess || false,
    },
    viewerPermissions: {
      canFork: universe.viewer_permissions?.canFork || false,
      canComment: universe.viewer_permissions?.canComment || false,
      canSeeCollaborators:
        universe.viewer_permissions?.canSeeCollaborators || true,
    },
  });

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleVisibilityChange = event => {
    setSettings(prev => ({
      ...prev,
      visibility: event.target.value,
    }));
  };

  const handleCollaboratorPermissionChange = permission => event => {
    setSettings(prev => ({
      ...prev,
      collaboratorPermissions: {
        ...prev.collaboratorPermissions,
        [permission]: event.target.checked,
      },
    }));
  };

  const handleViewerPermissionChange = permission => event => {
    setSettings(prev => ({
      ...prev,
      viewerPermissions: {
        ...prev.viewerPermissions,
        [permission]: event.target.checked,
      },
    }));
  };

  const handleGuestAccessChange = event => {
    setSettings(prev => ({
      ...prev,
      allowGuests: event.target.checked,
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const updatedUniverse = await universeService.updatePrivacySettings(
        universe.id,
        {
          is_public: settings.visibility === 'public',
          allow_guests: settings.allowGuests,
          collaborator_permissions: settings.collaboratorPermissions,
          viewer_permissions: settings.viewerPermissions,
        }
      );
      onUpdate(updatedUniverse);
      handleClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        startIcon={<SecurityIcon />}
        onClick={handleOpen}
        variant="outlined"
        size="small"
      >
        Privacy Settings
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Privacy Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Visibility</FormLabel>
              <RadioGroup
                value={settings.visibility}
                onChange={handleVisibilityChange}
              >
                <FormControlLabel
                  value="public"
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PublicIcon sx={{ mr: 1 }} />
                      <Box>
                        <Typography variant="body1">Public</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Anyone can view this universe
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="private"
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LockIcon sx={{ mr: 1 }} />
                      <Box>
                        <Typography variant="body1">Private</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Only you and collaborators can view this universe
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>
          </Box>

          <Box sx={{ mb: 3 }}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Collaborator Permissions</FormLabel>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={settings.collaboratorPermissions.canEdit}
                      onChange={handleCollaboratorPermissionChange('canEdit')}
                    />
                  }
                  label="Can edit universe parameters"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={settings.collaboratorPermissions.canInvite}
                      onChange={handleCollaboratorPermissionChange('canInvite')}
                    />
                  }
                  label="Can invite other collaborators"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={settings.collaboratorPermissions.canManageAccess}
                      onChange={handleCollaboratorPermissionChange(
                        'canManageAccess'
                      )}
                    />
                  }
                  label="Can manage access settings"
                />
              </FormGroup>
            </FormControl>
          </Box>

          {settings.visibility === 'public' && (
            <Box sx={{ mb: 3 }}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Viewer Permissions</FormLabel>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={settings.viewerPermissions.canFork}
                        onChange={handleViewerPermissionChange('canFork')}
                      />
                    }
                    label="Can fork universe"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={settings.viewerPermissions.canComment}
                        onChange={handleViewerPermissionChange('canComment')}
                      />
                    }
                    label="Can comment"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={settings.viewerPermissions.canSeeCollaborators}
                        onChange={handleViewerPermissionChange(
                          'canSeeCollaborators'
                        )}
                      />
                    }
                    label="Can see collaborators"
                  />
                </FormGroup>
              </FormControl>
            </Box>
          )}

          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.allowGuests}
                  onChange={handleGuestAccessChange}
                />
              }
              label="Allow guest access"
            />
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              Guests can view but cannot modify the universe
            </Typography>
          </Box>

          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PrivacySettings;
