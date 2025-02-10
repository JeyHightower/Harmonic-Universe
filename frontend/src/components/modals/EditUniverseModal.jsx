import { useUniverse } from '@/hooks/useUniverse';
import { commonStyles } from '@/styles/commonStyles';
import { Button, TextField } from '@mui/material';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import BaseModal from './BaseModal';

const EditUniverseModal = ({ open, onClose, data }) => {
  const { updateUniverse } = useUniverse();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: false,
  });

  useEffect(() => {
    if (data?.universe) {
      setFormData({
        name: data.universe.name,
        description: data.universe.description,
        isPublic: data.universe.isPublic,
      });
    }
  }, [data]);

  const handleSubmit = async () => {
    if (!data?.universe?.id) return;
    const result = await updateUniverse(data.universe.id, formData);
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
      title="Edit Universe"
      actions={actions}
    >
      <TextField
        autoFocus
        margin="dense"
        label="Universe Name"
        fullWidth
        value={formData.name}
        onChange={e => setFormData({ ...formData, name: e.target.value })}
        sx={commonStyles.formField}
      />
      <TextField
        margin="dense"
        label="Description"
        fullWidth
        multiline
        rows={4}
        value={formData.description}
        onChange={e => setFormData({ ...formData, description: e.target.value })}
        sx={commonStyles.formField}
      />
    </BaseModal>
  );
};

EditUniverseModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  data: PropTypes.shape({
    universe: PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      description: PropTypes.string,
      isPublic: PropTypes.bool,
    }),
  }),
};

export default EditUniverseModal;
