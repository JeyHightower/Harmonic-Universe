import { useVisualization } from '@/hooks/useVisualization';
import { commonStyles } from '@/styles/commonStyles';
import {
    Button,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
} from '@mui/material';
import PropTypes from 'prop-types';
import { useState } from 'react';
import BaseModal from './BaseModal';

const VISUALIZATION_TYPES = [
  { value: 'waveform', label: 'Waveform' },
  { value: 'spectrum', label: 'Spectrum' },
  { value: 'particles', label: 'Particles' },
];

const CreateVisualizationModal = ({ open, onClose, data }) => {
  const { createVisualization } = useVisualization();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'waveform',
    settings: {},
  });

  const handleSubmit = async () => {
    const result = await createVisualization({
      projectId: data?.projectId,
      data: formData,
    });
    if (result) {
      onClose();
      setFormData({
        name: '',
        description: '',
        type: 'waveform',
        settings: {},
      });
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
      title="Create New Visualization"
      actions={actions}
    >
      <TextField
        autoFocus
        margin="dense"
        label="Visualization Name"
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
      <FormControl fullWidth sx={commonStyles.formField}>
        <InputLabel>Visualization Type</InputLabel>
        <Select
          value={formData.type}
          label="Visualization Type"
          onChange={e => setFormData({ ...formData, type: e.target.value })}
        >
          {VISUALIZATION_TYPES.map(type => (
            <MenuItem key={type.value} value={type.value}>
              {type.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </BaseModal>
  );
};

CreateVisualizationModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  data: PropTypes.shape({
    projectId: PropTypes.string.isRequired,
  }),
};

export default CreateVisualizationModal;
