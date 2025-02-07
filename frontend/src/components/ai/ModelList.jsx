import {
    Add as AddIcon
} from '@mui/icons-material';
import ModelIcon from '@mui/icons-material/Memory';
import {
    Box,
    Button,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Stack,
    Typography
} from '@mui/material';
import {
    addModel,
    deleteModel,
    selectModels,
    startTraining,
    stopTraining
} from '@store/slices/aiSlice';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';


const MODEL_TEMPLATES = {
    audio_generation: {
        name: 'Audio Generation Model',
        description: 'Generate audio using deep learning',
        model_type: 'audio_generation',
        architecture: 'transformer',
        version: '1.0.0',
        parameters: {
            hidden_size: 512,
            num_layers: 8,
            num_heads: 8,
            dropout: 0.1,
            max_sequence_length: 1024,
        },
        metrics: {},
    },
    audio_analysis: {
        name: 'Audio Analysis Model',
        description: 'Analyze audio features and patterns',
        model_type: 'audio_analysis',
        architecture: 'cnn',
        version: '1.0.0',
        parameters: {
            conv_layers: 4,
            filters: [32, 64, 128, 256],
            kernel_sizes: [3, 3, 3, 3],
            pool_sizes: [2, 2, 2, 2],
            dense_layers: [512, 256],
            dropout: 0.3,
        },
        metrics: {},
    },
    physics_simulation: {
        name: 'Physics Simulation Model',
        description: 'Simulate physical interactions',
        model_type: 'physics_simulation',
        architecture: 'graph_network',
        version: '1.0.0',
        parameters: {
            node_size: 128,
            edge_size: 128,
            num_message_passing_steps: 10,
            latent_size: 256,
            output_size: 6,
        },
        metrics: {},
    },
};

const ModelList: React.FC = ({
    selectedModelId,
    onModelSelect,
}) => {
    const dispatch = useDispatch();
    const models = useSelector(selectModels);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleAddClick = (event: React.MouseEvent) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleAddModel = (type: keyof typeof MODEL_TEMPLATES) => {
        const template = MODEL_TEMPLATES[type];
        dispatch(addModel(template));
        handleMenuClose();
    };

    const handleDeleteModel = (id: number) => {
        dispatch(deleteModel(id));
        if (selectedModelId === id) {
            onModelSelect(-1);
        }
    };

    const handleToggleTraining = (id: number, isTraining: boolean) => {
        if (isTraining) {
            dispatch(stopTraining(id));
        } else {
            dispatch(startTraining(id));
        }
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6">Models</Typography>
                <Button
                    startIcon={<AddIcon />}
                    onClick={handleAddClick}
                    size="small"
                    variant="contained"
                >
                    Add Model
                </Button>
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                >
                    <MenuItem onClick={() => handleAddModel('audio_generation')}>
                        Audio Generation
                    </MenuItem>
                    <MenuItem onClick={() => handleAddModel('audio_analysis')}>
                        Audio Analysis
                    </MenuItem>
                    <MenuItem onClick={() => handleAddModel('physics_simulation')}>
                        Physics Simulation
                    </MenuItem>
                </Menu>
            </Stack>

            <List sx={{ flexGrow: 1, overflow: 'auto' }}>
                {models.length === 0 ? (
                    
                        <Typography variant="body2" color="text.secondary">
                            No models available
                        </Typography>
                    </ListItem>
                ) : (
                    models.map((model) => (
                        <ListItem key={model.id} disablePadding>
                            <ListItemButton
                                selected={model.id === selectedModelId}
                                onClick={() => onModelSelect(model.id)}
                            >
                                
                                    <ModelIcon />
                                </ListItemIcon>
                                <ListItemText
                                    primary={model.name}
                                    secondary={
                                        
                                            <Typography variant="body2" color="text.secondary">
                                                {model.type}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Version: {model.version}
                                            </Typography>
                                        </>
                                    }
                                />
                            </ListItemButton>
                        </ListItem>
                    ))
                )}
            </List>
        </Box>
    );
};

export default ModelList;
