import {
    Add as AddIcon,
    Delete as DeleteIcon,
    PowerSettingsNew as PowerIcon,
} from '@mui/icons-material';
import {
    Box,
    FormControl,
    IconButton,
    InputLabel,
    List,
    ListItem,
    ListItemSecondaryAction,
    ListItemText,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { updateVisualization } from '@store/slices/visualizationSlice';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';

interface DataMappingPanelProps {
    visualization: {
        id: number;
        data_source: string;
        data_mappings?: Array<{
            id: number;
            data_field: string;
            visual_property: string;
            mapping_type: string;
            range_min?: number;
            range_max?: number;
            scale_factor?: number;
            enabled: boolean;
        }>;
    } | null;
}

const MAPPING_TYPES = [
    { value: 'linear', label: 'Linear' },
    { value: 'logarithmic', label: 'Logarithmic' },
    { value: 'exponential', label: 'Exponential' },
    { value: 'categorical', label: 'Categorical' },
];

const VISUAL_PROPERTIES = {
    waveform: [
        { value: 'amplitude', label: 'Amplitude' },
        { value: 'color', label: 'Color' },
        { value: 'opacity', label: 'Opacity' },
    ],
    spectrum: [
        { value: 'height', label: 'Height' },
        { value: 'color', label: 'Color' },
        { value: 'width', label: 'Width' },
    ],
    physics_3d: [
        { value: 'position', label: 'Position' },
        { value: 'rotation', label: 'Rotation' },
        { value: 'scale', label: 'Scale' },
        { value: 'color', label: 'Color' },
        { value: 'opacity', label: 'Opacity' },
    ],
};

const DATA_FIELDS = {
    audio: [
        { value: 'amplitude', label: 'Amplitude' },
        { value: 'frequency', label: 'Frequency' },
        { value: 'spectral_centroid', label: 'Spectral Centroid' },
        { value: 'rms', label: 'RMS' },
    ],
    physics: [
        { value: 'position', label: 'Position' },
        { value: 'velocity', label: 'Velocity' },
        { value: 'acceleration', label: 'Acceleration' },
        { value: 'force', label: 'Force' },
    ],
    ai_model: [
        { value: 'prediction', label: 'Prediction' },
        { value: 'confidence', label: 'Confidence' },
        { value: 'error', label: 'Error' },
        { value: 'latency', label: 'Latency' },
    ],
};

const DataMappingPanel: React.FC<DataMappingPanelProps> = ({ visualization }) => {
    const dispatch = useDispatch();
    const [newMapping, setNewMapping] = useState({
        data_field: '',
        visual_property: '',
        mapping_type: 'linear',
    });

    const handleAddMapping = () => {
        if (!visualization || !newMapping.data_field || !newMapping.visual_property) return;

        const mapping = {
            id: Date.now(),
            ...newMapping,
            range_min: 0,
            range_max: 1,
            scale_factor: 1,
            enabled: true,
        };

        dispatch(
            updateVisualization({
                id: visualization.id,
                data_mappings: [...(visualization.data_mappings || []), mapping],
            })
        );

        setNewMapping({
            data_field: '',
            visual_property: '',
            mapping_type: 'linear',
        });
    };

    const handleUpdateMapping = (
        mappingId: number,
        field: string,
        value: any
    ) => {
        if (!visualization) return;

        dispatch(
            updateVisualization({
                id: visualization.id,
                data_mappings: visualization.data_mappings?.map(mapping =>
                    mapping.id === mappingId
                        ? {
                            ...mapping,
                            [field]: value,
                        }
                        : mapping
                ),
            })
        );
    };

    const handleDeleteMapping = (mappingId: number) => {
        if (!visualization) return;

        dispatch(
            updateVisualization({
                id: visualization.id,
                data_mappings: visualization.data_mappings?.filter(
                    mapping => mapping.id !== mappingId
                ),
            })
        );
    };

    if (!visualization) {
        return (
            <Box sx={{ p: 2 }}>
                <Typography variant="subtitle1" color="text.secondary">
                    Select a visualization to configure data mappings
                </Typography>
            </Box>
        );
    }

    const dataFields = DATA_FIELDS[visualization.data_source as keyof typeof DATA_FIELDS] || [];
    const visualProperties =
        VISUAL_PROPERTIES[
        visualization.visualization_type as keyof typeof VISUAL_PROPERTIES
        ] || [];

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
            <Typography variant="h6" gutterBottom>
                Data Mappings
            </Typography>

            <Stack spacing={3}>
                <Box>
                    <Typography variant="subtitle2" gutterBottom>
                        Add New Mapping
                    </Typography>
                    <Stack spacing={2}>
                        <FormControl size="small">
                            <InputLabel>Data Field</InputLabel>
                            <Select
                                value={newMapping.data_field}
                                label="Data Field"
                                onChange={e =>
                                    setNewMapping(prev => ({
                                        ...prev,
                                        data_field: e.target.value,
                                    }))
                                }
                            >
                                {dataFields.map(field => (
                                    <MenuItem key={field.value} value={field.value}>
                                        {field.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl size="small">
                            <InputLabel>Visual Property</InputLabel>
                            <Select
                                value={newMapping.visual_property}
                                label="Visual Property"
                                onChange={e =>
                                    setNewMapping(prev => ({
                                        ...prev,
                                        visual_property: e.target.value,
                                    }))
                                }
                            >
                                {visualProperties.map(prop => (
                                    <MenuItem key={prop.value} value={prop.value}>
                                        {prop.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl size="small">
                            <InputLabel>Mapping Type</InputLabel>
                            <Select
                                value={newMapping.mapping_type}
                                label="Mapping Type"
                                onChange={e =>
                                    setNewMapping(prev => ({
                                        ...prev,
                                        mapping_type: e.target.value,
                                    }))
                                }
                            >
                                {MAPPING_TYPES.map(type => (
                                    <MenuItem key={type.value} value={type.value}>
                                        {type.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <IconButton
                            onClick={handleAddMapping}
                            disabled={!newMapping.data_field || !newMapping.visual_property}
                            color="primary"
                        >
                            <AddIcon />
                        </IconButton>
                    </Stack>
                </Box>

                <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Active Mappings
                    </Typography>
                    <List>
                        {visualization.data_mappings?.map(mapping => (
                            <ListItem
                                key={mapping.id}
                                sx={{
                                    opacity: mapping.enabled ? 1 : 0.5,
                                }}
                            >
                                <ListItemText
                                    primary={`${dataFields.find(f => f.value === mapping.data_field)
                                            ?.label
                                        } → ${visualProperties.find(
                                            p => p.value === mapping.visual_property
                                        )?.label
                                        }`}
                                    secondary={`${MAPPING_TYPES.find(t => t.value === mapping.mapping_type)
                                            ?.label
                                        } Mapping`}
                                />
                                <Stack spacing={2} sx={{ mx: 2, minWidth: 120 }}>
                                    <TextField
                                        label="Min"
                                        type="number"
                                        size="small"
                                        value={mapping.range_min}
                                        onChange={e =>
                                            handleUpdateMapping(
                                                mapping.id,
                                                'range_min',
                                                parseFloat(e.target.value)
                                            )
                                        }
                                    />
                                    <TextField
                                        label="Max"
                                        type="number"
                                        size="small"
                                        value={mapping.range_max}
                                        onChange={e =>
                                            handleUpdateMapping(
                                                mapping.id,
                                                'range_max',
                                                parseFloat(e.target.value)
                                            )
                                        }
                                    />
                                    <TextField
                                        label="Scale"
                                        type="number"
                                        size="small"
                                        value={mapping.scale_factor}
                                        onChange={e =>
                                            handleUpdateMapping(
                                                mapping.id,
                                                'scale_factor',
                                                parseFloat(e.target.value)
                                            )
                                        }
                                    />
                                </Stack>
                                <ListItemSecondaryAction>
                                    <IconButton
                                        edge="end"
                                        onClick={() =>
                                            handleUpdateMapping(
                                                mapping.id,
                                                'enabled',
                                                !mapping.enabled
                                            )
                                        }
                                    >
                                        <PowerIcon
                                            color={mapping.enabled ? 'primary' : 'disabled'}
                                        />
                                    </IconButton>
                                    <IconButton
                                        edge="end"
                                        onClick={() => handleDeleteMapping(mapping.id)}
                                        sx={{ ml: 1 }}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </Stack>
        </Box>
    );
};

export default DataMappingPanel;
