import { useAudio } from '@/hooks/useAudio';
import { commonStyles } from '@/styles/commonStyles';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import {
    Box,
    Button,
    LinearProgress,
    TextField,
    Typography,
} from '@mui/material';
import PropTypes from 'prop-types';
import { useRef, useState } from 'react';
import BaseModal from './BaseModal';

const CreateAudioModal = ({ open, onClose, data }) => {
  const { handleUploadAudio } = useAudio(data?.projectId);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = event => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Use the file name (without extension) as the default title
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
      setError('');
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }

    try {
      setUploading(true);
      setError('');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title.trim());

      const result = await handleUploadAudio(formData);
      if (result) {
        onClose();
        setFile(null);
        setTitle('');
        setError('');
      }
    } catch (err) {
      setError(err.message || 'Failed to upload audio file');
    } finally {
      setUploading(false);
    }
  };

  const actions = (
    <>
      <Button onClick={onClose} sx={commonStyles.button} disabled={uploading}>
        Cancel
      </Button>
      <Button
        onClick={handleSubmit}
        variant="contained"
        sx={commonStyles.button}
        disabled={uploading}
      >
        Upload
      </Button>
    </>
  );

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Upload Audio Track"
      actions={actions}
    >
      <input
        type="file"
        accept="audio/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        ref={fileInputRef}
      />
      <Button
        variant="outlined"
        component="span"
        fullWidth
        startIcon={<CloudUploadIcon />}
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        sx={commonStyles.button}
      >
        {file ? file.name : 'Select Audio File'}
      </Button>

      <TextField
        margin="normal"
        label="Track Title"
        fullWidth
        value={title}
        onChange={e => setTitle(e.target.value)}
        disabled={uploading}
        sx={commonStyles.formField}
      />

      {error && (
        <Typography color="error" variant="body2" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}

      {uploading && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress />
        </Box>
      )}
    </BaseModal>
  );
};

CreateAudioModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  data: PropTypes.shape({
    projectId: PropTypes.string.isRequired,
  }),
};

export default CreateAudioModal;
