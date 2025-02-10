import { useAudio } from '@/hooks/useAudio';
import { commonStyles } from '@/styles/commonStyles';
import { Button, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import BaseModal from './BaseModal';

const DeleteAudioModal = ({ open, onClose, data }) => {
  const { deleteAudioTrack } = useAudio(data?.projectId);

  const handleDelete = async () => {
    if (!data?.track?.id) return;
    const result = await deleteAudioTrack(data.track.id);
    if (result) {
      onClose();
    }
  };

  const actions = (
    <>
      <Button onClick={onClose} sx={commonStyles.button}>
        Cancel
      </Button>
      <Button
        onClick={handleDelete}
        variant="contained"
        color="error"
        sx={commonStyles.button}
      >
        Delete
      </Button>
    </>
  );

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Delete Audio Track"
      actions={actions}
    >
      <Typography variant="body1" sx={{ mb: 2 }}>
        Are you sure you want to delete "{data?.track?.title}"?
      </Typography>
      <Typography variant="body2" color="text.secondary">
        This action cannot be undone. The audio file and all associated data
        will be permanently deleted.
      </Typography>
    </BaseModal>
  );
};

DeleteAudioModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  data: PropTypes.shape({
    projectId: PropTypes.string.isRequired,
    track: PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
    }),
  }),
};

export default DeleteAudioModal;
