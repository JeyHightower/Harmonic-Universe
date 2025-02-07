import { updateVisualization } from '@/store/slices/visualizationSlice';
import { AppDispatch } from '@/store/store';
import { DataMapping, DataSource, VisualizationUpdateData } from '@/types/visualization';
import {
    Add as AddIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import {
    Box,
    Button,
    Card,
    CardContent,
    Divider,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    List,
    ListItem,
    ListItemText,
    MenuItem,
    Select,
    SelectChangeEvent,
    Stack,
    Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';

const MAPPING_TYPES = [
    { value: 'direct', label: 'Direct' },
    { value: 'scale', label: 'Scale' },
    { value: 'map', label: 'Map' },
    { value: 'custom', label: 'Custom' },
] as const;

type VisualProperty = {
    value: string;
    label: string;
};

const VISUAL_PROPERTIES: Record<DataSource, VisualProperty[]> = {
    audio: [
        { value: 'amplitude', label: 'Amplitude' },
        { value: 'color', label: 'Color' },
        { value: 'opacity', label: 'Opacity' },
    ],
    physics: [
        { value: 'position', label: 'Position' },
        { value: 'rotation', label: 'Rotation' },
        { value: 'scale', label: 'Scale' },
        { value: 'color', label: 'Color' },
        { value: 'opacity', label: 'Opacity' },
    ],
    ai_model: [
        { value: 'height', label: 'Height' },
        { value: 'color', label: 'Color' },
        { value: 'width', label: 'Width' },
    ],
};

const DATA_FIELDS: Record<DataSource, VisualProperty[]> = {
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

type NewMapping = {
    sourceField: string;
    targetField: string;
    transformationType: typeof MAPPING_TYPES[number]['value'];
};

interface DataMappingPanelProps {
    visualization: {
        id: number;
        data_source: DataSource;
        dataMappings?: DataMapping[];
    };
}

const DataMappingPanel: React.FC<DataMappingPanelProps> = ({ visualization }) => {
    const dispatch = useDispatch<AppDispatch>();
    const [newMapping, setNewMapping] = useState<NewMapping>({
        sourceField: '',
        targetField: '',
        transformationType: 'direct',
    });

    const handleAddMapping = () => {
        if (!visualization || !newMapping.sourceField || !newMapping.targetField) return;

        const mapping: DataMapping = {
            sourceField: newMapping.sourceField,
            targetField: newMapping.targetField,
            transformationType: newMapping.transformationType,
            transformationConfig: {
                inputRange: [0, 1],
                outputRange: [0, 1],
            },
        };

        const updateData: VisualizationUpdateData = {
            dataMappings: [...(visualization.dataMappings || []), mapping],
        };

        dispatch(updateVisualization({ id: visualization.id, data: updateData }));

        setNewMapping({
            sourceField: '',
            targetField: '',
            transformationType: 'direct',
        });
    };

    const handleUpdateMapping = (index: number, field: keyof DataMapping, value: string) => {
        if (!visualization?.dataMappings) return;

        const updatedMappings = [...visualization.dataMappings];
        updatedMappings[index] = {
            ...updatedMappings[index],
            [field]: value,
        };

        const updateData: VisualizationUpdateData = {
            dataMappings: updatedMappings,
        };

        dispatch(updateVisualization({ id: visualization.id, data: updateData }));
    };

    const handleDeleteMapping = (index: number) => {
        if (!visualization?.dataMappings) return;

        const updateData: VisualizationUpdateData = {
            dataMappings: visualization.dataMappings.filter((_, i) => i !== index),
        };

        dispatch(updateVisualization({ id: visualization.id, data: updateData }));
    };

    const handleSourceFieldChange = (event: SelectChangeEvent<string>) => {
        setNewMapping(prev => ({
            ...prev,
            sourceField: event.target.value,
        }));
    };

    const handleTargetFieldChange = (event: SelectChangeEvent<string>) => {
        setNewMapping(prev => ({
            ...prev,
            targetField: event.target.value,
        }));
    };

    const handleTransformationTypeChange = (event: SelectChangeEvent<string>) => {
        setNewMapping(prev => ({
            ...prev,
            transformationType: event.target.value as typeof MAPPING_TYPES[number]['value'],
        }));
    };

    if (!visualization) return null;

    return (
        <Card>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">Data Mappings</Typography>
                    <Button
                        startIcon={<AddIcon />}
                        onClick={handleAddMapping}
                        disabled={!newMapping.sourceField || !newMapping.targetField}
                    >
                        Add Mapping
                    </Button>
                </Box>
                <Divider sx={{ my: 2 }} />

                <Stack spacing={2}>
                    <Grid container spacing={2}>
                        <Grid item xs={4}>
                            <FormControl fullWidth>
                                <InputLabel>Source Field</InputLabel>
                                <Select
                                    value={newMapping.sourceField}
                                    onChange={handleSourceFieldChange}
                                    label="Source Field"
                                >
                                    {DATA_FIELDS[visualization.data_source].map(field => (
                                        <MenuItem key={field.value} value={field.value}>
                                            {field.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={4}>
                            <FormControl fullWidth>
                                <InputLabel>Target Field</InputLabel>
                                <Select
                                    value={newMapping.targetField}
                                    onChange={handleTargetFieldChange}
                                    label="Target Field"
                                >
                                    {VISUAL_PROPERTIES[visualization.data_source].map(prop => (
                                        <MenuItem key={prop.value} value={prop.value}>
                                            {prop.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={4}>
                            <FormControl fullWidth>
                                <InputLabel>Transformation Type</InputLabel>
                                <Select
                                    value={newMapping.transformationType}
                                    onChange={handleTransformationTypeChange}
                                    label="Transformation Type"
                                >
                                    {MAPPING_TYPES.map(type => (
                                        <MenuItem key={type.value} value={type.value}>
                                            {type.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>

                    <List>
                        {visualization.dataMappings?.map((mapping, index) => (
                            <ListItem
                                key={index}
                                secondaryAction={
                                    <IconButton edge="end" onClick={() => handleDeleteMapping(index)}>
                                        <DeleteIcon />
                                    </IconButton>
                                }
                            >
                                <ListItemText
                                    primary={
                                        <Grid container spacing={2}>
                                            <Grid item xs={4}>
                                                <FormControl fullWidth>
                                                    <Select
                                                        value={mapping.sourceField}
                                                        onChange={(e) => handleUpdateMapping(index, 'sourceField', e.target.value)}
                                                        size="small"
                                                    >
                                                        {DATA_FIELDS[visualization.data_source].map(field => (
                                                            <MenuItem key={field.value} value={field.value}>
                                                                {field.label}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            </Grid>
                                            <Grid item xs={4}>
                                                <FormControl fullWidth>
                                                    <Select
                                                        value={mapping.targetField}
                                                        onChange={(e) => handleUpdateMapping(index, 'targetField', e.target.value)}
                                                        size="small"
                                                    >
                                                        {VISUAL_PROPERTIES[visualization.data_source].map(prop => (
                                                            <MenuItem key={prop.value} value={prop.value}>
                                                                {prop.label}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            </Grid>
                                            <Grid item xs={4}>
                                                <FormControl fullWidth>
                                                    <Select
                                                        value={mapping.transformationType}
                                                        onChange={(e) => handleUpdateMapping(index, 'transformationType', e.target.value as typeof MAPPING_TYPES[number]['value'])}
                                                        size="small"
                                                    >
                                                        {MAPPING_TYPES.map(type => (
                                                            <MenuItem key={type.value} value={type.value}>
                                                                {type.label}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            </Grid>
                                        </Grid>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                </Stack>
            </CardContent>
        </Card>
    );
};

export default DataMappingPanel;
