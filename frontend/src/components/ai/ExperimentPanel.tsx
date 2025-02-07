import { useModelExperiments } from '@hooks/useModelExperiments';
import {
    Add as AddIcon,
    Compare as CompareIcon,
    Delete as DeleteIcon,
    ExpandMore,
    PlayArrow,
    Stop,
} from '@mui/icons-material';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    Chip,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Stack,
    TextField,
    Typography
} from '@mui/material';
import React, { useState } from 'react';

interface ExperimentPanelProps {
    model: {
        id: number;
        name: string;
        parameters: {
            [key: string]: any;
        };
    } | null;
}

const ExperimentPanel: React.FC<ExperimentPanelProps> = ({ model }) => {
    const experiments = useModelExperiments(model?.id ?? null);
    const [newExperimentName, setNewExperimentName] = useState('');
    const [selectedExperiments, setSelectedExperiments] = useState<number[]>([]);

    if (!model) {
        return (
            <Box sx={{ p: 2 }}>
                <Typography variant="subtitle1" color="text.secondary">
                    Select a model to view experiments
                </Typography>
            </Box>
        );
    }

    const handleCreateExperiment = async () => {
        if (!newExperimentName.trim()) return;

        await experiments.createExperiment(newExperimentName, {
            description: `Experiment for ${model.name}`,
            hyperparameters: model.parameters,
        });

        setNewExperimentName('');
    };

    const handleStartExperiment = async (experimentId: number) => {
        await experiments.startExperiment(experimentId);
    };

    const handleStopExperiment = async (experimentId: number) => {
        await experiments.stopExperiment(experimentId);
    };

    const handleDeleteExperiment = async (experimentId: number) => {
        const experiment = experiments.experiments.find(e => e.id === experimentId);
        if (experiment?.status === 'running') {
            await experiments.stopExperiment(experimentId);
        }
        // Note: Delete functionality would be handled by the backend
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
        const comparison = await experiments.compareExperiments(selectedExperiments);
        // Handle comparison results (e.g., show in a modal or new panel)
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
            <Stack spacing={3}>
                <Box>
                    <Typography variant="h6" gutterBottom>
                        Experiments
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <TextField
                            size="small"
                            value={newExperimentName}
                            onChange={e => setNewExperimentName(e.target.value)}
                            placeholder="New experiment name"
                            fullWidth
                        />
                        <Button
                            startIcon={<AddIcon />}
                            onClick={handleCreateExperiment}
                            disabled={!newExperimentName.trim()}
                            variant="contained"
                        >
                            Create
                        </Button>
                    </Stack>
                </Box>

                {selectedExperiments.length >= 2 && (
                    <Button
                        startIcon={<CompareIcon />}
                        onClick={handleCompareExperiments}
                        variant="outlined"
                        fullWidth
                    >
                        Compare Selected ({selectedExperiments.length})
                    </Button>
                )}

                <List sx={{ flexGrow: 1, overflow: 'auto' }}>
                    {experiments.experiments.map(experiment => (
                        <Accordion key={experiment.id}>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Stack
                                    direction="row"
                                    spacing={2}
                                    alignItems="center"
                                    sx={{ width: '100%' }}
                                >
                                    <IconButton
                                        size="small"
                                        onClick={e => {
                                            e.stopPropagation();
                                            handleToggleExperimentSelection(experiment.id);
                                        }}
                                        color={
                                            selectedExperiments.includes(experiment.id)
                                                ? 'primary'
                                                : 'default'
                                        }
                                    >
                                        <CompareIcon />
                                    </IconButton>
                                    <Typography>{experiment.name}</Typography>
                                    <Chip
                                        label={experiment.status}
                                        size="small"
                                        color={experiment.status === 'running' ? 'success' : 'default'}
                                    />
                                </Stack>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Stack spacing={2}>
                                    <Box>
                                        <Typography variant="subtitle2" gutterBottom>
                                            Description
                                        </Typography>
                                        <Typography variant="body2">
                                            {experiment.description}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="subtitle2" gutterBottom>
                                            Hyperparameters
                                        </Typography>
                                        <List dense>
                                            {Object.entries(experiment.hyperparameters).map(
                                                ([key, value]) => (
                                                    <ListItem key={key}>
                                                        <ListItemText
                                                            primary={key}
                                                            secondary={value.toString()}
                                                        />
                                                    </ListItem>
                                                )
                                            )}
                                        </List>
                                    </Box>

                                    {experiment.metrics && Object.keys(experiment.metrics).length > 0 && (
                                        <Box>
                                            <Typography variant="subtitle2" gutterBottom>
                                                Metrics
                                            </Typography>
                                            <List dense>
                                                {Object.entries(experiment.metrics).map(
                                                    ([key, value]) => (
                                                        <ListItem key={key}>
                                                            <ListItemText
                                                                primary={key}
                                                                secondary={value.toString()}
                                                            />
                                                        </ListItem>
                                                    )
                                                )}
                                            </List>
                                        </Box>
                                    )}

                                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                                        {experiment.status === 'running' ? (
                                            <Button
                                                startIcon={<Stop />}
                                                onClick={() => handleStopExperiment(experiment.id)}
                                                color="error"
                                            >
                                                Stop
                                            </Button>
                                        ) : (
                                            <Button
                                                startIcon={<PlayArrow />}
                                                onClick={() => handleStartExperiment(experiment.id)}
                                                disabled={experiment.status === 'completed'}
                                            >
                                                Start
                                            </Button>
                                        )}
                                        <IconButton
                                            onClick={() => handleDeleteExperiment(experiment.id)}
                                            color="error"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Stack>
                                </Stack>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </List>
            </Stack>
        </Box>
    );
};

export default ExperimentPanel;
