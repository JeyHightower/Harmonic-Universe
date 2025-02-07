import { useVisualization } from '@/hooks/useVisualization';
import { VisualizationFormData } from '@/types/visualization';
import {
    Delete as DeleteIcon,
    PlayArrow as PlayArrowIcon,
    Stop as StopIcon
} from '@mui/icons-material';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    IconButton,
    InputLabel,
    List,
    ListItem,
    ListItemSecondaryAction,
    ListItemText,
    MenuItem,
    Select,
    TextField,
    Tooltip,
    Typography
} from '@mui/material';
import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';

interface VisualizationListProps {
    projectId: number;
}

const VISUALIZATION_TEMPLATES = {
    waveform: {
        name: 'Waveform',
        description: 'Audio waveform visualization',
        visualization_type: 'waveform',
        data_source: 'audio',
        settings: {
            waveColor: '#1976d2',
            progressColor: '#4caf50',
            cursorColor: '#f50057',
            height: 128,
            normalize: true,
        },
        layout: {
            position: 'center',
            size: 'full',
        },
        style: {
            backgroundColor: 'transparent',
        },
        is_real_time: true,
        update_interval: 1 / 60,
    },
    spectrum: {
        name: 'Spectrum',
        description: 'Audio frequency spectrum',
        visualization_type: 'spectrum',
        data_source: 'audio',
        settings: {
            barCount: 128,
            barColor: '#1976d2',
            barSpacing: 1,
            minDecibels: -90,
            maxDecibels: -10,
            smoothingTimeConstant: 0.85,
        },
        layout: {
            position: 'center',
            size: 'full',
        },
        style: {
            backgroundColor: 'transparent',
        },
        is_real_time: true,
        update_interval: 1 / 30,
    },
    physics3d: {
        name: 'Physics 3D',
        description: '3D physics visualization',
        visualization_type: 'physics_3d',
        data_source: 'physics',
        settings: {
            cameraPosition: [5, 5, 5],
            cameraFov: 75,
            showGrid: true,
            showAxes: true,
            backgroundColor: '#000000',
        },
        layout: {
            position: 'center',
            size: 'full',
        },
        style: {
            backgroundColor: '#000000',
        },
        is_real_time: true,
        update_interval: 1 / 60,
    },
};

export const VisualizationList: React.FC<VisualizationListProps> = ({ projectId }) => {
    const dispatch = useDispatch();
    const {
        visualizations,
        loading,
        error,
        isRealTime,
        fetchVisualizations,
        createVisualization,
        deleteVisualization: deleteVisualizationHook,
        startRealTime,
        stopRealTime,
    } = useVisualization(projectId);

    const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
    const [formData, setFormData] = React.useState<VisualizationFormData>({
        name: '',
        type: 'waveform',
        dataSource: '',
    });

    useEffect(() => {
        fetchVisualizations();
    }, [fetchVisualizations]);

    const handleCreateDialogOpen = () => {
        setIsCreateDialogOpen(true);
    };

    const handleCreateDialogClose = () => {
        setIsCreateDialogOpen(false);
        setFormData({
            name: '',
            type: 'waveform',
            dataSource: '',
        });
    };

    const handleCreate = async () => {
        await createVisualization(formData);
        handleCreateDialogClose();
    };

    const handleDelete = async (visualizationId: number) => {
        await deleteVisualizationHook(visualizationId);
    };

    if (loading) {
        return <Typography>Loading visualizations...</Typography>;
    }

    if (error) {
        return <Typography color="error">Error: {error}</Typography>;
    }

    if (!visualizations.length) {
        return (
            <Box>
                <Typography sx={{ mb: 2 }}>No visualizations available</Typography>
                <Button variant="contained" onClick={handleCreateDialogOpen}>
                    Create Visualization
                </Button>
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ mb: 2 }}>
                <Button variant="contained" onClick={handleCreateDialogOpen}>
                    Create Visualization
                </Button>
            </Box>

            <List>
                {visualizations.map((visualization) => (
                    <ListItem key={visualization.id}>
                        <ListItemText
                            primary={visualization.name}
                            secondary={`Type: ${visualization.type} | Data Source: ${visualization.dataSource}`}
                        />
                        <ListItemSecondaryAction>
                            <Tooltip title={isRealTime ? 'Stop' : 'Start'}>
                                <IconButton
                                    onClick={() => (isRealTime ? stopRealTime() : startRealTime())}
                                    color={isRealTime ? 'secondary' : 'primary'}
                                >
                                    {isRealTime ? <StopIcon /> : <PlayArrowIcon />}
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                                <IconButton onClick={() => handleDelete(visualization.id)}>
                                    <DeleteIcon />
                                </IconButton>
                            </Tooltip>
                        </ListItemSecondaryAction>
                    </ListItem>
                ))}
            </List>

            <Dialog open={isCreateDialogOpen} onClose={handleCreateDialogClose}>
                <DialogTitle>Create Visualization</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <TextField
                            fullWidth
                            label="Name"
                            value={formData.name}
                            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                            sx={{ mb: 2 }}
                        />
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Type</InputLabel>
                            <Select
                                value={formData.type}
                                label="Type"
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, type: e.target.value as any }))
                                }
                            >
                                <MenuItem value="waveform">Waveform</MenuItem>
                                <MenuItem value="spectrogram">Spectrogram</MenuItem>
                                <MenuItem value="3d">3D</MenuItem>
                                <MenuItem value="realtime">Real-time</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            fullWidth
                            label="Data Source"
                            value={formData.dataSource}
                            onChange={(e) => setFormData((prev) => ({ ...prev, dataSource: e.target.value }))}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCreateDialogClose}>Cancel</Button>
                    <Button
                        onClick={handleCreate}
                        disabled={!formData.name || !formData.type || !formData.dataSource}
                    >
                        Create
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default VisualizationList;
