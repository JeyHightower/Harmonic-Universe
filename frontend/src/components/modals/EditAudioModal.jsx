import { useAudio } from '@/hooks/useAudio';
import { commonStyles } from '@/styles/commonStyles';
import {
    Button,
    FormControlLabel,
    Switch,
    TextField,
    Typography,
} from '@mui/material';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import BaseModal from './BaseModal';

const EditAudioModal = ({ open, onClose, data }) => {
  const { updateAudioTrack } = useAudio(data?.projectId);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isPublic: false,
    volume: 1,
    isMuted: false,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (data?.track) {
      setFormData({
        title: data.track.title,
        description: data.track.description || '',
        isPublic: data.track.isPublic || false,
        volume: data.track.volume || 1,
        isMuted: data.track.isMuted || false,
      });
      setError('');
    }
  }, [data]);

  const handleSubmit = async () => {
    if (!data?.track?.id) return;

    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      const result = await updateAudioTrack(data.track.id, formData);
      if (result) {
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to update audio track');
    }
  };

  const actions = (
    <>
      <Button onClick={onClose} sx={commonStyles.button}>
        Cancel
      </Button>
      <Button
        onClick={handleSubmit}
        variant="contained"
        sx={commonStyles.button}
      >
        Save Changes
      </Button>
    </>
  );

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Edit Audio Track"
      actions={actions}
    >
      <TextField
        autoFocus
        margin="dense"
        label="Track Title"
        fullWidth
        value={formData.title}
        onChange={e => setFormData({ ...formData, title: e.target.value })}
        sx={commonStyles.formField}
      />

      <TextField
        margin="dense"
        label="Description"
        fullWidth
        multiline
        rows={3}
        value={formData.description}
        onChange={e => setFormData({ ...formData, description: e.target.value })}
        sx={commonStyles.formField}
      />

      <TextField
        type="number"
        margin="dense"
        label="Volume"
        fullWidth
        value={formData.volume}
        onChange={e =>
          setFormData({
            ...formData,
            volume: Math.max(0, Math.min(1, Number(e.target.value))),
          })
        }
        inputProps={{ min: 0, max: 1, step: 0.1 }}
        sx={commonStyles.formField}
      />

      <FormControlLabel
        control={
          <Switch
            checked={formData.isMuted}
            onChange={e =>
              setFormData({ ...formData, isMuted: e.target.checked })
            }
          />
        }
        label="Muted"
        sx={{ mb: 2 }}
      />

      <FormControlLabel
        control={
          <Switch
            checked={formData.isPublic}
            onChange={e =>
              setFormData({ ...formData, isPublic: e.target.checked })
            }
          />
        }
        label="Public"
      />

      {error && (
        <Typography color="error" variant="body2" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}
    </BaseModal>
  );
};

EditAudioModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  data: PropTypes.shape({
    projectId: PropTypes.string.isRequired,
    track: PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
      isPublic: PropTypes.bool,
      volume: PropTypes.number,
      isMuted: PropTypes.bool,
    }),
  }),
};

export default EditAudioModal;
