import { useModelServing } from '@/hooks/useModelServing';
import { AIModel } from '@/store/slices/aiSlice';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Grid,
    IconButton,
    LinearProgress,
    Typography,
} from '@mui/material';
import React from 'react';

interface ModelServingProps {
    model: AIModel;
}

const ModelServing: React.FC<ModelServingProps> = ({ model }) => {
    const { deployments, createDeployment, updateDeployment, deleteDeployment, loading } =
        useModelServing(model.id);

    const handleCreateDeployment = () => {
        createDeployment({
            version: model.version,
            resources: {
                cpu: 1,
                memory: 1024,
            },
        });
    };

    const handleStartDeployment = (id: number) => {
        updateDeployment(id, { status: 'running' });
    };

    const handleStopDeployment = (id: number) => {
        updateDeployment(id, { status: 'stopped' });
    };

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Model Deployments</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreateDeployment}
                    disabled={loading}
                >
                    New Deployment
                </Button>
            </Box>

            {loading && <LinearProgress sx={{ mb: 2 }} />}

            <Grid container spacing={2}>
                {deployments.map(deployment => (
                    <Grid item xs={12} md={6} key={deployment.id}>
                        <Card>
                            <CardHeader
                                title={`Deployment ${deployment.id}`}
                                subheader={`Version: ${deployment.version}`}
                                action={
                                    <IconButton onClick={() => deleteDeployment(deployment.id)}>
                                        <DeleteIcon />
                                    </IconButton>
                                }
                            />
                            <CardContent>
                                <Typography variant="subtitle2" gutterBottom>
                                    Status: {deployment.status}
                                </Typography>
                                {deployment.endpoint && (
                                    <Typography variant="body2" gutterBottom>
                                        Endpoint: {deployment.endpoint}
                                    </Typography>
                                )}
                                <Typography variant="subtitle2" sx={{ mt: 1 }}>
                                    Resources:
                                </Typography>
                                <Typography variant="body2">CPU: {deployment.resources.cpu} cores</Typography>
                                <Typography variant="body2">Memory: {deployment.resources.memory} MB</Typography>
                                {deployment.resources.gpu && (
                                    <Typography variant="body2">GPU: {deployment.resources.gpu} units</Typography>
                                )}
                                {deployment.metrics && (
                                    <Box sx={{ mt: 1 }}>
                                        <Typography variant="subtitle2">Metrics:</Typography>
                                        <Typography variant="body2">
                                            Requests: {deployment.metrics.requestCount}
                                        </Typography>
                                        <Typography variant="body2">
                                            Error Rate: {(deployment.metrics.errorRate * 100).toFixed(2)}%
                                        </Typography>
                                        <Typography variant="body2">
                                            Latency: {deployment.metrics.latency.toFixed(2)}ms
                                        </Typography>
                                        <Typography variant="body2">
                                            Throughput: {deployment.metrics.throughput.toFixed(2)} req/s
                                        </Typography>
                                    </Box>
                                )}
                                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                    {deployment.status === 'running' ? (
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            startIcon={<StopIcon />}
                                            onClick={() => handleStopDeployment(deployment.id)}
                                        >
                                            Stop
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="outlined"
                                            color="primary"
                                            startIcon={<PlayArrowIcon />}
                                            onClick={() => handleStartDeployment(deployment.id)}
                                            disabled={deployment.status === 'failed'}
                                        >
                                            Start
                                        </Button>
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default ModelServing;
