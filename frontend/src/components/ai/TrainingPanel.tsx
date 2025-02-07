import { ExpandMore } from '@mui/icons-material';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    CircularProgress,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import {
    startTraining,
    stopTraining,
    updateModel,
} from '@store/slices/aiSlice';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';

interface TrainingPanelProps {
    model: {
        id: number;
        name: string;
        model_type: string;
        architecture: string;
        status: string;
        parameters: {
            [key: string]: any;
        };
        metrics: {
            [key: string]: any;
        };
    } | null;
}

const TrainingPanel: React.FC<TrainingPanelProps> = ({ model }) => {
    const dispatch = useDispatch();
    const [selectedDataset, setSelectedDataset] = useState<string>('');

    if (!model) {
        return (
            <Box sx={{ p: 2 }}>
                <Typography variant="subtitle1" color="text.secondary">
                    Select a model to configure training
                </Typography>
            </Box>
        );
    }

    const handleParameterChange = (key: string, value: any) => {
        dispatch(
            updateModel({
                id: model.id,
                parameters: {
                    ...model.parameters,
                    [key]: value,
                },
            })
        );
    };

    const handleStartTraining = () => {
        dispatch(startTraining(model.id));
    };

    const handleStopTraining = () => {
        dispatch(stopTraining(model.id));
    };

    const renderParameters = () => {
        return Object.entries(model.parameters).map(([key, value]) => {
            if (typeof value === 'number') {
                return (
                    <Box key={key}>
                        <Typography gutterBottom>{key}</Typography>
                        <TextField
                            fullWidth
                            size="small"
                            type="number"
                            value={value}
                            onChange={(e) =>
                                handleParameterChange(key, parseFloat(e.target.value))
                            }
                        />
                    </Box>
                );
            }
            if (Array.isArray(value)) {
                return (
                    <Box key={key}>
                        <Typography gutterBottom>{key}</Typography>
                        <TextField
                            fullWidth
                            size="small"
                            value={value.join(', ')}
                            onChange={(e) =>
                                handleParameterChange(
                                    key,
                                    e.target.value.split(',').map((v) => parseFloat(v.trim()))
                                )
                            }
                            helperText="Enter comma-separated values"
                        />
                    </Box>
                );
            }
            return null;
        });
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
            <Typography variant="h6" gutterBottom>
                Training Configuration
            </Typography>

            <Stack spacing={3}>
                <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography>Model Information</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Stack spacing={2}>
                            <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                    Name
                                </Typography>
                                <Typography>{model.name}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                    Type
                                </Typography>
                                <Typography>{model.model_type}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                    Architecture
                                </Typography>
                                <Typography>{model.architecture}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                    Status
                                </Typography>
                                <Typography>{model.status}</Typography>
                            </Box>
                        </Stack>
                    </AccordionDetails>
                </Accordion>

                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography>Dataset Selection</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <FormControl fullWidth size="small">
                            <InputLabel>Dataset</InputLabel>
                            <Select
                                value={selectedDataset}
                                onChange={(e) => setSelectedDataset(e.target.value)}
                                label="Dataset"
                            >
                                <MenuItem value="dataset1">Dataset 1</MenuItem>
                                <MenuItem value="dataset2">Dataset 2</MenuItem>
                                <MenuItem value="dataset3">Dataset 3</MenuItem>
                            </Select>
                        </FormControl>
                    </AccordionDetails>
                </Accordion>

                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography>Model Parameters</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Stack spacing={2}>{renderParameters()}</Stack>
                    </AccordionDetails>
                </Accordion>

                <Box sx={{ mt: 2 }}>
                    {model.status === 'training' ? (
                        <Stack spacing={2} alignItems="center">
                            <CircularProgress />
                            <Button
                                variant="contained"
                                color="error"
                                onClick={handleStopTraining}
                            >
                                Stop Training
                            </Button>
                        </Stack>
                    ) : (
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleStartTraining}
                            disabled={!selectedDataset}
                        >
                            Start Training
                        </Button>
                    )}
                </Box>
            </Stack>
        </Box>
    );
};

export default TrainingPanel;
