import { useUniverse } from '@/hooks/useUniverse';
import { commonStyles } from '@/styles/commonStyles';
import { Button, TextField } from '@mui/material';
import { useState } from 'react';
import BaseModal from './BaseModal';

const CreateUniverseModal = ({ open, onClose }) => {
  const { createUniverse } = useUniverse();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: false,
  });

  const handleSubmit = async () => {
    const result = await createUniverse(formData);
    if (result) {
      onClose();
      setFormData({ name: '', description: '', isPublic: false });
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
        Create
      </Button>
    </>
  );

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Create New Universe"
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

export default CreateUniverseModal;
