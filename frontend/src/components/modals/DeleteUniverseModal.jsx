import { useUniverse } from '@/hooks/useUniverse';
import { commonStyles } from '@/styles/commonStyles';
import { Button, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import BaseModal from './BaseModal';

const DeleteUniverseModal = ({ open, onClose, data }) => {
  const { deleteUniverse } = useUniverse();

  const handleDelete = async () => {
    if (!data?.universe?.id) return;
    const result = await deleteUniverse(data.universe.id);
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
      title="Delete Universe"
      actions={actions}
    >
      <Typography variant="body1" sx={{ mb: 2 }}>
        Are you sure you want to delete "{data?.universe?.name}"?
      </Typography>
      <Typography variant="body2" color="text.secondary">
        This action cannot be undone. All associated visualizations and audio
        tracks will be permanently deleted.
      </Typography>
    </BaseModal>
  );
};

DeleteUniverseModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  data: PropTypes.shape({
    universe: PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
  }),
};

export default DeleteUniverseModal;
