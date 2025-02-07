import { useVisualization } from '@/hooks/useVisualization';

import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    List,
    ListItem,
    ListItemSecondaryAction,
    ListItemText,
    MenuItem,
    TextField,
    Typography,
} from '@mui/material';
import React, { useState } from 'react';


const VisualizationList: React.FC = ({ projectId, audioId }) => {
    const {
        visualizations,
        currentVisualization,
        loading,
        error,
        create,
        update,
        remove,
        setCurrent,
    } = useVisualization({ projectId, audioId });

    const [openDialog, setOpenDialog] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        type: 'waveform',
        settings: {
            width: 800,
            height: 400,
            backgroundColor: '#000000',
            foregroundColor: '#ffffff',
            showAxes: true,
            showGrid: true,
        },
    });

    const handleOpenDialog = () => {
        if (!audioId) {
            alert('Please select an audio file first');
            return;
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setFormData({
            name: '',
            type: 'waveform',
            settings: {
                width: 800,
                height: 400,
                backgroundColor: '#000000',
                foregroundColor: '#ffffff',
                showAxes: true,
                showGrid: true,
            },
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await create(formData);
            handleCloseDialog();
        } catch (error) {
            console.error('Failed to create visualization:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this visualization?')) {
            try {
                await remove(id);
            } catch (error) {
                console.error('Failed to delete visualization:', error);
            }
        }
    };

    const handleSelect = (visualization: typeof visualizations[0]) => {
        setCurrent(visualization);
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box p={2}>
                <Typography color="error">{error}</Typography>
            </Box>
        );
    }

    return (
        
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Visualizations</Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleOpenDialog}
                    disabled={!audioId}
                >
                    New Visualization
                </Button>
            </Box>

            
                {visualizations.map(visualization => (
                    <ListItem
                        key={visualization.id}
                        button
                        selected={currentVisualization?.id === visualization.id}
                        onClick={() => handleSelect(visualization)}
                    >
                        <ListItemText
                            primary={visualization.name}
                            secondary={`Type: ${visualization.type}`}
                        />
                        
                            <IconButton
                                edge="end"
                                aria-label="edit"
                                onClick={e => {
                                    e.stopPropagation();
                                    // TODO: Implement edit functionality
                                }}
                            >
                                <EditIcon />
                            </IconButton>
                            <IconButton
                                edge="end"
                                aria-label="delete"
                                onClick={e => {
                                    e.stopPropagation();
                                    handleDelete(visualization.id);
                                }}
                            >
                                <DeleteIcon />
                            </IconButton>
                        </ListItemSecondaryAction>
                    </ListItem>
                ))}
            </List>

            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <form onSubmit={handleSubmit}>
                    Create New Visualization</DialogTitle>
                    
                        <Box mt={2}>
                            <TextField
                                fullWidth
                                label="Name"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                                margin="normal"
                            />
                            <TextField
                                fullWidth
                                select
                                label="Type"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                                required
                                margin="normal"
                            >
                                <MenuItem value="waveform">Waveform</MenuItem>
                                <MenuItem value="spectrum">Spectrum</MenuItem>
                                <MenuItem value="spectrogram">Spectrogram</MenuItem>
                                <MenuItem value="custom">Custom</MenuItem>
                            </TextField>
                        </Box>
                    </DialogContent>
                    
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button type="submit" variant="contained" color="primary">
                            Create
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
};

export default VisualizationList;
