import { useAudio } from '@/hooks/useAudio';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';

const AudioUploadModal = ({ open, onClose, projectId }) => {
  const { handleUploadAudio } = useAudio(projectId);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = event => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Use the file name (without extension) as the default title
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
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
      formData.append('title', title);

      await handleUploadAudio(formData);
      handleClose();
    } catch (err) {
      setError(err.message || 'Failed to upload audio file');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setTitle('');
    setError('');
    setUploading(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Upload Audio Track</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <input
            accept="audio/*"
            style={{ display: 'none' }}
            id="audio-file-upload"
            type="file"
            onChange={handleFileChange}
            disabled={uploading}
          />
          <label htmlFor="audio-file-upload">
            <Button
              variant="outlined"
              component="span"
              startIcon={<CloudUploadIcon />}
              disabled={uploading}
              fullWidth
            >
              {file ? file.name : 'Select Audio File'}
            </Button>
          </label>

          <TextField
            margin="normal"
            label="Track Title"
            fullWidth
            value={title}
            onChange={e => setTitle(e.target.value)}
            disabled={uploading}
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
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={uploading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={uploading}>
          Upload
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AudioUploadModal;
