import { useModelDeployment } from '@hooks/useModelDeployment';
import { useModelMonitoring } from '@hooks/useModelMonitoring';
import {
    CloudUpload,
    ExpandMore,
    Settings,
    Speed,
    Storage,
} from '@mui/icons-material';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Slider,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';

interface ModelServingProps {
    model: {
        id: number;
        name: string;
        version: string;
        status: string;
        deployment?: {
            status: string;
            endpoint: string | null;
        };
    } | null;
}

const ENVIRONMENTS = [
    { value: 'development', label: 'Development' },
    { value: 'staging', label: 'Staging' },
    { value: 'production', label: 'Production' },
];

const ModelServing: React.FC<ModelServingProps> = ({ model }) => {
    const deployment = useModelDeployment(model?.id ?? null);
    const monitoring = useModelMonitoring(model?.id ?? null);

    const [environment, setEnvironment] = useState('development');
    const [resources, setResources] = useState({
        cpu: 1,
        memory: 1,
        gpu: 0,
    });
    const [scaling, setScaling] = useState({
        minReplicas: 1,
        maxReplicas: 3,
        targetCPUUtilization: 80,
    });

    useEffect(() => {
        if (model?.id) {
            monitoring.startMonitoring();
        }
        return () => {
            monitoring.stopMonitoring();
        };
    }, [model?.id]);

    if (!model) {
        return (
            <Box sx={{ p: 2 }}>
                <Typography variant="subtitle1" color="text.secondary">
                    Select a model to configure deployment
                </Typography>
            </Box>
        );
    }

    const handleDeploy = async () => {
        await deployment.deployModel({
            environment,
            resources,
            scaling,
            version: model.version,
        });
    };

    const handleStop = async () => {
        await deployment.stopDeployment();
    };

    const isDeploying = deployment.deploymentStatus === 'deploying';
    const isDeployed = deployment.deploymentStatus === 'deployed';

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
            <Stack spacing={3}>
                <Box>
                    <Typography variant="h6" gutterBottom>
                        Model Serving
                    </Typography>
                    {deployment.deploymentEndpoint && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Endpoint: {deployment.deploymentEndpoint}
                        </Alert>
                    )}
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                            label={`Status: ${deployment.deploymentStatus}`}
                            color={isDeployed ? 'success' : 'default'}
                        />
                        <Chip label={`Version: ${model.version}`} />
                    </Stack>
                </Box>

                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Settings />
                            <Typography>Deployment Configuration</Typography>
                        </Stack>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Stack spacing={3}>
                            <FormControl fullWidth>
                                <InputLabel>Environment</InputLabel>
                                <Select
                                    value={environment}
                                    onChange={(e) => setEnvironment(e.target.value)}
                                    label="Environment"
                                >
                                    {ENVIRONMENTS.map((env) => (
                                        <MenuItem key={env.value} value={env.value}>
                                            {env.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>
                    </AccordionDetails>
                </Accordion>

                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Storage />
                            <Typography>Resource Allocation</Typography>
                        </Stack>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Stack spacing={3}>
                            <Box>
                                <Typography gutterBottom>CPU Cores</Typography>
                                <Slider
                                    value={resources.cpu}
                                    onChange={(_, value) =>
                                        setResources({ ...resources, cpu: value as number })
                                    }
                                    min={0.5}
                                    max={4}
                                    step={0.5}
                                    marks
                                    valueLabelDisplay="auto"
                                />
                            </Box>
                            <Box>
                                <Typography gutterBottom>Memory (GB)</Typography>
                                <Slider
                                    value={resources.memory}
                                    onChange={(_, value) =>
                                        setResources({ ...resources, memory: value as number })
                                    }
                                    min={1}
                                    max={16}
                                    step={1}
                                    marks
                                    valueLabelDisplay="auto"
                                />
                            </Box>
                            <Box>
                                <Typography gutterBottom>GPU Units</Typography>
                                <Slider
                                    value={resources.gpu}
                                    onChange={(_, value) =>
                                        setResources({ ...resources, gpu: value as number })
                                    }
                                    min={0}
                                    max={4}
                                    step={1}
                                    marks
                                    valueLabelDisplay="auto"
                                />
                            </Box>
                        </Stack>
                    </AccordionDetails>
                </Accordion>

                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Speed />
                            <Typography>Scaling Configuration</Typography>
                        </Stack>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Stack spacing={3}>
                            <Box>
                                <Typography gutterBottom>Minimum Replicas</Typography>
                                <TextField
                                    type="number"
                                    value={scaling.minReplicas}
                                    onChange={(e) =>
                                        setScaling({
                                            ...scaling,
                                            minReplicas: parseInt(e.target.value),
                                        })
                                    }
                                    inputProps={{ min: 1, max: 10 }}
                                    fullWidth
                                />
                            </Box>
                            <Box>
                                <Typography gutterBottom>Maximum Replicas</Typography>
                                <TextField
                                    type="number"
                                    value={scaling.maxReplicas}
                                    onChange={(e) =>
                                        setScaling({
                                            ...scaling,
                                            maxReplicas: parseInt(e.target.value),
                                        })
                                    }
                                    inputProps={{ min: 1, max: 20 }}
                                    fullWidth
                                />
                            </Box>
                            <Box>
                                <Typography gutterBottom>Target CPU Utilization (%)</Typography>
                                <Slider
                                    value={scaling.targetCPUUtilization}
                                    onChange={(_, value) =>
                                        setScaling({
                                            ...scaling,
                                            targetCPUUtilization: value as number,
                                        })
                                    }
                                    min={50}
                                    max={90}
                                    step={5}
                                    marks
                                    valueLabelDisplay="auto"
                                />
                            </Box>
                        </Stack>
                    </AccordionDetails>
                </Accordion>

                <Box sx={{ mt: 2 }}>
                    {isDeployed ? (
                        <Button
                            variant="contained"
                            color="error"
                            onClick={handleStop}
                            startIcon={<CloudUpload />}
                            fullWidth
                        >
                            Stop Deployment
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleDeploy}
                            startIcon={isDeploying ? <CircularProgress size={20} /> : <CloudUpload />}
                            disabled={isDeploying}
                            fullWidth
                        >
                            {isDeploying ? 'Deploying...' : 'Deploy Model'}
                        </Button>
                    )}
                </Box>

                {deployment.deploymentLogs.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Deployment Logs
                        </Typography>
                        <Box
                            sx={{
                                maxHeight: 200,
                                overflow: 'auto',
                                bgcolor: 'background.paper',
                                p: 1,
                                borderRadius: 1,
                            }}
                        >
                            {deployment.deploymentLogs.map((log, index) => (
                                <Typography
                                    key={index}
                                    variant="body2"
                                    fontFamily="monospace"
                                    sx={{ whiteSpace: 'pre-wrap' }}
                                >
                                    {log}
                                </Typography>
                            ))}
                        </Box>
                    </Box>
                )}
            </Stack>
        </Box>
    );
};

export default ModelServing;
