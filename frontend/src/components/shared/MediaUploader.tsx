import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import ErrorIcon from '@mui/icons-material/Error';
import {
    Box,
    CircularProgress,
    IconButton,
    LinearProgress,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Typography
} from '@mui/material';
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMediaService } from '../../hooks/useMediaService';

interface MediaUploaderProps {
    allowedTypes: string[];
    maxSize?: number;
    onUploadComplete?: (assets: any[]) => void;
}

interface UploadItem {
    id: string;
    file: File;
    progress: number;
    status: 'pending' | 'uploading' | 'complete' | 'error';
    error?: string;
    result?: any;
}

const MediaUploader: React.FC<MediaUploaderProps> = ({
    allowedTypes,
    maxSize = 10 * 1024 * 1024, // 10MB default
    onUploadComplete,
}) => {
    const [uploads, setUploads] = useState<UploadItem[]>([]);
    const { uploadFile, processMedia } = useMediaService();

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            const newUploads = acceptedFiles.map((file) => ({
                id: Math.random().toString(36).substr(2, 9),
                file,
                progress: 0,
                status: 'pending' as const,
            }));

            setUploads((prev) => [...prev, ...newUploads]);

            // Start uploading each file
            newUploads.forEach(handleUpload);
        },
        [uploadFile]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: allowedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
        maxSize,
        multiple: true,
    });

    const handleUpload = async (upload: UploadItem) => {
        try {
            setUploads((prev) =>
                prev.map((u) =>
                    u.id === upload.id ? { ...u, status: 'uploading' } : u
                )
            );

            // Upload file
            const result = await uploadFile(upload.file, {
                onProgress: (progress) => {
                    setUploads((prev) =>
                        prev.map((u) =>
                            u.id === upload.id ? { ...u, progress } : u
                        )
                    );
                },
            });

            // Process media if needed
            if (result) {
                const processed = await processMedia(result.id, {
                    optimize: true,
                    generateThumbnail: true,
                });

                setUploads((prev) =>
                    prev.map((u) =>
                        u.id === upload.id
                            ? { ...u, status: 'complete', result: processed }
                            : u
                    )
                );

                // Notify parent component
                const completeUploads = uploads.filter((u) => u.status === 'complete');
                if (onUploadComplete) {
                    onUploadComplete(completeUploads.map((u) => u.result));
                }
            }
        } catch (error) {
            setUploads((prev) =>
                prev.map((u) =>
                    u.id === upload.id
                        ? { ...u, status: 'error', error: error.message }
                        : u
                )
            );
        }
    };

    const removeUpload = (uploadId: string) => {
        setUploads((prev) => prev.filter((u) => u.id !== uploadId));
    };

    return (
        <Box>
            <Box
                {...getRootProps()}
                sx={{
                    border: '2px dashed',
                    borderColor: isDragActive ? 'primary.main' : 'grey.300',
                    borderRadius: 1,
                    p: 3,
                    textAlign: 'center',
                    cursor: 'pointer',
                    bgcolor: isDragActive ? 'action.hover' : 'background.paper',
                }}
            >
                <input {...getInputProps()} />
                <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                    {isDragActive
                        ? 'Drop files here'
                        : 'Drag and drop files here, or click to select'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                    Allowed types: {allowedTypes.join(', ')}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                    Max size: {Math.round(maxSize / 1024 / 1024)}MB
                </Typography>
            </Box>

            {uploads.length > 0 && (
                <List sx={{ mt: 2 }}>
                    {uploads.map((upload) => (
                        <ListItem
                            key={upload.id}
                            secondaryAction={
                                <IconButton
                                    edge="end"
                                    onClick={() => removeUpload(upload.id)}
                                    disabled={upload.status === 'uploading'}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            }
                        >
                            <ListItemIcon>
                                {upload.status === 'uploading' ? (
                                    <CircularProgress size={24} />
                                ) : upload.status === 'complete' ? (
                                    <CheckCircleIcon color="success" />
                                ) : upload.status === 'error' ? (
                                    <ErrorIcon color="error" />
                                ) : null}
                            </ListItemIcon>
                            <ListItemText
                                primary={upload.file.name}
                                secondary={
                                    upload.status === 'error' ? (
                                        <Typography color="error">{upload.error}</Typography>
                                    ) : upload.status === 'uploading' ? (
                                        <Box sx={{ width: '100%' }}>
                                            <LinearProgress
                                                variant="determinate"
                                                value={upload.progress}
                                            />
                                        </Box>
                                    ) : null
                                }
                            />
                        </ListItem>
                    ))}
                </List>
            )}
        </Box>
    );
};

export default MediaUploader;
