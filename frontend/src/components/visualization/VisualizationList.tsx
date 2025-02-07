import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    PlayArrow,
    Stop,
} from '@mui/icons-material';
import {
    Box,
    IconButton,
    List,
    ListItem,
    ListItemSecondaryAction,
    ListItemText,
    Menu,
    MenuItem,
    Stack,
    Typography,
} from '@mui/material';
import { RootState } from '@store/index';
import {
    addVisualization,
    deleteVisualization,
    updateVisualization,
} from '@store/slices/visualizationSlice';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

interface VisualizationListProps {
    selectedVisualizationId: number | null;
    onVisualizationSelect: (id: number) => void;
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

const VisualizationList: React.FC<VisualizationListProps> = ({
    selectedVisualizationId,
    onVisualizationSelect,
}) => {
    const dispatch = useDispatch();
    const visualizations = useSelector(
        (state: RootState) => state.visualization.visualizations
    );
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleAddClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleAddVisualization = (type: keyof typeof VISUALIZATION_TEMPLATES) => {
        const template = VISUALIZATION_TEMPLATES[type];
        dispatch(addVisualization(template));
        handleMenuClose();
    };

    const handleDeleteVisualization = (id: number) => {
        dispatch(deleteVisualization(id));
        if (selectedVisualizationId === id) {
            onVisualizationSelect(-1);
        }
    };

    const handleToggleRealTime = (id: number, isRealTime: boolean) => {
        dispatch(
            updateVisualization({
                id,
                is_real_time: !isRealTime,
            })
        );
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6">Visualizations</Typography>
                <IconButton onClick={handleAddClick} size="small">
                    <AddIcon />
                </IconButton>
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                >
                    <MenuItem onClick={() => handleAddVisualization('waveform')}>
                        Waveform
                    </MenuItem>
                    <MenuItem onClick={() => handleAddVisualization('spectrum')}>
                        Spectrum
                    </MenuItem>
                    <MenuItem onClick={() => handleAddVisualization('physics3d')}>
                        Physics 3D
                    </MenuItem>
                </Menu>
            </Stack>

            <List sx={{ flexGrow: 1, overflow: 'auto' }}>
                {visualizations.map((visualization) => (
                    <ListItem
                        key={visualization.id}
                        selected={visualization.id === selectedVisualizationId}
                        onClick={() => onVisualizationSelect(visualization.id)}
                        sx={{
                            cursor: 'pointer',
                            '&:hover': {
                                backgroundColor: 'action.hover',
                            },
                        }}
                    >
                        <ListItemText
                            primary={visualization.name}
                            secondary={visualization.description}
                        />
                        <ListItemSecondaryAction>
                            <IconButton
                                edge="end"
                                onClick={() =>
                                    handleToggleRealTime(
                                        visualization.id,
                                        visualization.is_real_time
                                    )
                                }
                            >
                                {visualization.is_real_time ? <Stop /> : <PlayArrow />}
                            </IconButton>
                            <IconButton edge="end" sx={{ ml: 1 }}>
                                <EditIcon />
                            </IconButton>
                            <IconButton
                                edge="end"
                                onClick={() => handleDeleteVisualization(visualization.id)}
                                sx={{ ml: 1 }}
                            >
                                <DeleteIcon />
                            </IconButton>
                        </ListItemSecondaryAction>
                    </ListItem>
                ))}
            </List>
        </Box>
    );
};

export default VisualizationList;
