import { useVisualization } from '@/hooks/useVisualization';
import { commonStyles } from '@/styles/commonStyles';
import { Button, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import BaseModal from './BaseModal';

const DeleteVisualizationModal = ({ open, onClose, data }) => {
  const { deleteVisualization } = useVisualization();

  const handleDelete = async () => {
    if (!data?.visualization?.id) return;
    const result = await deleteVisualization(data.visualization.id);
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
      title="Delete Visualization"
      actions={actions}
    >
      <Typography variant="body1" sx={{ mb: 2 }}>
        Are you sure you want to delete "{data?.visualization?.name}"?
      </Typography>
      <Typography variant="body2" color="text.secondary">
        This action cannot be undone. All associated settings and data will be
        permanently deleted.
      </Typography>
    </BaseModal>
  );
};

DeleteVisualizationModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  data: PropTypes.shape({
    visualization: PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
  }),
};

export default DeleteVisualizationModal;
