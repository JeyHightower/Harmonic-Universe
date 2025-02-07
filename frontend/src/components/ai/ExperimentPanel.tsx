import { useModelExperiments } from '@/hooks/useModelExperiments';
import { AIModel } from '@/store/slices/aiSlice';
import {
    Add as AddIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Grid,
    IconButton,
    LinearProgress,
    Typography
} from '@mui/material';
import React, { useState } from 'react';

interface ExperimentPanelProps {
    model: AIModel;
}

const ExperimentPanel: React.FC<ExperimentPanelProps> = ({ model }) => {
    const { experiments, createExperiment, deleteExperiment, loading } = useModelExperiments(model.id);
    const [newExperimentName, setNewExperimentName] = useState('');
    const [selectedExperiments, setSelectedExperiments] = useState<number[]>([]);

    const handleCreateExperiment = () => {
        createExperiment({
            name: `Experiment ${experiments.length + 1}`,
            description: 'New experiment',
            config: {
                hyperparameters: {
                    learningRate: 0.001,
                    batchSize: 32,
                    epochs: 10,
                },
            },
        });
    };

    const handleStartExperiment = async (experimentId: number) => {
        // Implementation needed
    };

    const handleStopExperiment = async (experimentId: number) => {
        // Implementation needed
    };

    const handleDeleteExperiment = async (experimentId: number) => {
        deleteExperiment(experimentId);
    };

    const handleToggleExperimentSelection = (experimentId: number) => {
        setSelectedExperiments(prev =>
            prev.includes(experimentId)
                ? prev.filter(id => id !== experimentId)
                : [...prev, experimentId]
        );
    };

    const handleCompareExperiments = async () => {
        if (selectedExperiments.length < 2) return;
        // Implementation needed
    };

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Experiments</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreateExperiment}
                    disabled={loading}
                >
                    New Experiment
                </Button>
            </Box>

            {loading && <LinearProgress sx={{ mb: 2 }} />}

            <Grid container spacing={2}>
                {experiments.map(experiment => (
                    <Grid item xs={12} md={6} key={experiment.id}>
                        <Card>
                            <CardHeader
                                title={experiment.name}
                                action={
                                    <IconButton onClick={() => handleDeleteExperiment(experiment.id)}>
                                        <DeleteIcon />
                                    </IconButton>
                                }
                            />
                            <CardContent>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    {experiment.description}
                                </Typography>
                                <Typography variant="subtitle2" gutterBottom>
                                    Status: {experiment.status}
                                </Typography>
                                {experiment.metrics && (
                                    <Box>
                                        <Typography variant="subtitle2">Metrics:</Typography>
                                        {Object.entries(experiment.metrics).map(([key, value]) => (
                                            <Typography key={key} variant="body2">
                                                {key}: {value}
                                            </Typography>
                                        ))}
                                    </Box>
                                )}
                                <Typography variant="subtitle2" sx={{ mt: 1 }}>
                                    Hyperparameters:
                                </Typography>
                                {Object.entries(experiment.config.hyperparameters).map(([key, value]) => (
                                    <Typography key={key} variant="body2">
                                        {key}: {value}
                                    </Typography>
                                ))}
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default ExperimentPanel;
