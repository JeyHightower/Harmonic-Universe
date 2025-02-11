import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import ErrorIcon from '@mui/icons-material/Error';
import {
    Box,
    IconButton,
    LinearProgress,
    List,
    ListItem,
    ListItemSecondaryAction,
    ListItemText,
    Paper,
    Typography,
    useTheme,
} from '@mui/material';
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploadProps {
    onUpload: (files: File[]) => Promise<void>;
    accept?: Record<string, string[]>;
    maxFiles?: number;
    maxSize?: number;
    disabled?: boolean;
}

interface UploadFile extends File {
    id: string;
    progress: number;
    error?: string;
    status: 'pending' | 'uploading' | 'success' | 'error';
}

const FileUpload: React.FC<FileUploadProps> = ({
    onUpload,
    accept,
    maxFiles = 5,
    maxSize = 5 * 1024 * 1024, // 5MB
    disabled = false,
}) => {
    const theme = useTheme();
    const [files, setFiles] = useState<UploadFile[]>([]);

    const onDrop = useCallback(
        async (acceptedFiles: File[]) => {
            const newFiles = acceptedFiles.map((file) => ({
                ...file,
                id: Math.random().toString(36).substr(2, 9),
                progress: 0,
                status: 'pending' as const,
            }));

            setFiles((prev) => [...prev, ...newFiles]);

            try {
                await onUpload(acceptedFiles);
                setFiles((prev) =>
                    prev.map((file) =>
                        newFiles.find((f) => f.id === file.id)
                            ? { ...file, status: 'success', progress: 100 }
                            : file
                    )
                );
            } catch (error) {
                setFiles((prev) =>
                    prev.map((file) =>
                        newFiles.find((f) => f.id === file.id)
                            ? { ...file, status: 'error', error: error.message }
                            : file
                    )
                );
            }
        },
        [onUpload]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept,
        maxFiles: maxFiles - files.length,
        maxSize,
        disabled,
    });

    const handleRemove = (id: string) => {
        setFiles((prev) => prev.filter((file) => file.id !== id));
    };

    return (
        <Box>
            <Paper
                {...getRootProps()}
                sx={{
                    p: 3,
                    border: `2px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.divider
                        }`,
                    bgcolor: isDragActive
                        ? theme.palette.action.hover
                        : theme.palette.background.paper,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.6 : 1,
                }}
            >
                <input {...getInputProps()} />
                <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                >
                    <CloudUploadIcon
                        sx={{
                            fontSize: 48,
                            color: theme.palette.text.secondary,
                            mb: 2,
                        }}
                    />
                    <Typography variant="h6" gutterBottom>
                        {isDragActive
                            ? 'Drop files here'
                            : 'Drag and drop files here, or click to select'}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Maximum file size: {maxSize / (1024 * 1024)}MB
                    </Typography>
                </Box>
            </Paper>

            {files.length > 0 && (
                <List sx={{ mt: 2 }}>
                    {files.map((file) => (
                        <ListItem key={file.id}>
                            <ListItemText
                                primary={file.name}
                                secondary={
                                    file.error ||
                                    `${(file.size / 1024).toFixed(1)} KB - ${file.status}`
                                }
                            />
                            <ListItemSecondaryAction>
                                {file.status === 'uploading' && (
                                    <Box sx={{ width: 100, mr: 2 }}>
                                        <LinearProgress variant="determinate" value={file.progress} />
                                    </Box>
                                )}
                                {file.status === 'success' && (
                                    <CheckCircleIcon sx={{ color: 'success.main', mr: 2 }} />
                                )}
                                {file.status === 'error' && (
                                    <ErrorIcon sx={{ color: 'error.main', mr: 2 }} />
                                )}
                                <IconButton
                                    edge="end"
                                    aria-label="delete"
                                    onClick={() => handleRemove(file.id)}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </ListItemSecondaryAction>
                        </ListItem>
                    ))}
                </List>
            )}
        </Box>
    );
};

export default FileUpload;
