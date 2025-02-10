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
import { useEffect, useState } from 'react';
import BaseModal from './BaseModal';

const VISUALIZATION_TYPES = [
  { value: 'waveform', label: 'Waveform' },
  { value: 'spectrum', label: 'Spectrum' },
  { value: 'particles', label: 'Particles' },
];

const EditVisualizationModal = ({ open, onClose, data }) => {
  const { updateVisualization } = useVisualization();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'waveform',
    settings: {},
  });

  useEffect(() => {
    if (data?.visualization) {
      setFormData({
        name: data.visualization.name,
        description: data.visualization.description,
        type: data.visualization.type,
        settings: data.visualization.settings || {},
      });
    }
  }, [data]);

  const handleSubmit = async () => {
    if (!data?.visualization?.id) return;
    const result = await updateVisualization({
      id: data.visualization.id,
      data: formData,
    });
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
      title="Edit Visualization"
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

EditVisualizationModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  data: PropTypes.shape({
    visualization: PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      description: PropTypes.string,
      type: PropTypes.string.isRequired,
      settings: PropTypes.object,
    }),
  }),
};

export default EditVisualizationModal;
