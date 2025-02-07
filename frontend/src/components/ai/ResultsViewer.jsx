import { AITraining } from '@/hooks/useAITraining';
import { ModelExperiments } from '@/hooks/useModelExperiments';
import { ModelMonitoring } from '@/hooks/useModelMonitoring';
import { AIModel } from '@/store/slices/aiSlice';
import {
    Box,
    Card,
    CardContent,
    CardHeader,
    Divider,
    LinearProgress,
    Typography,
} from '@mui/material';
import React from 'react';


const ResultsViewer: React.FC = ({ model, training, monitoring, experiments }) => {
    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
                Results & Metrics
            </Typography>

            <Card sx={{ mb: 2 }}>
                <CardHeader title="Model Information" />
                
                    <Typography variant="body2" gutterBottom>
                        Name: {model.name}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                        Type: {model.type}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                        Version: {model.version}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                        Status: {model.status}
                    </Typography>
                </CardContent>
            </Card>

            <Card sx={{ mb: 2 }}>
                <CardHeader title="Training Metrics" />
                
                    {model.training.status === 'running' && <LinearProgress sx={{ mb: 2 }} />}
                    <Typography variant="body2" gutterBottom>
                        Status: {model.training.status}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                        Progress: {(model.training.progress * 100).toFixed(1)}%
                    </Typography>
                    {model.training.metrics && (
                        
                            <Divider sx={{ my: 1 }} />
                            {Object.entries(model.training.metrics).map(([key, value]) => (
                                <Typography key={key} variant="body2" gutterBottom>
                                    {key}: {typeof value === 'number' ? value.toFixed(4) : value}
                                </Typography>
                            ))}
                        </>
                    )}
                    {model.training.error && (
                        
                            <Divider sx={{ my: 1 }} />
                            <Typography variant="body2" color="error">
                                Error: {model.training.error}
                            </Typography>
                        </>
                    )}
                </CardContent>
            </Card>

            <Card sx={{ mb: 2 }}>
                <CardHeader title="Monitoring Metrics" />
                
                    {monitoring.loading && <LinearProgress sx={{ mb: 2 }} />}
                    {monitoring.metrics.length > 0 ? (
                        monitoring.metrics.map((metric, index) => (
                            <Box key={index} sx={{ mb: 1 }}>
                                <Typography variant="body2" gutterBottom>
                                    Accuracy: {(metric.accuracy * 100).toFixed(2)}%
                                </Typography>
                                <Typography variant="body2" gutterBottom>
                                    Loss: {metric.loss.toFixed(4)}
                                </Typography>
                                <Typography variant="body2" gutterBottom>
                                    Precision: {(metric.precision * 100).toFixed(2)}%
                                </Typography>
                                <Typography variant="body2" gutterBottom>
                                    Recall: {(metric.recall * 100).toFixed(2)}%
                                </Typography>
                                <Typography variant="body2" gutterBottom>
                                    F1 Score: {(metric.f1Score * 100).toFixed(2)}%
                                </Typography>
                                {index < monitoring.metrics.length - 1 && <Divider sx={{ my: 1 }} />}
                            </Box>
                        ))
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            No monitoring data available
                        </Typography>
                    )}
                </CardContent>
            </Card>

            
                <CardHeader title="Experiment Results" />
                
                    {experiments.loading && <LinearProgress sx={{ mb: 2 }} />}
                    {experiments.experiments.length > 0 ? (
                        experiments.experiments.map((experiment, index) => (
                            <Box key={experiment.id} sx={{ mb: 1 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    {experiment.name}
                                </Typography>
                                <Typography variant="body2" gutterBottom>
                                    Status: {experiment.status}
                                </Typography>
                                {experiment.metrics && (
                                    
                                        <Divider sx={{ my: 1 }} />
                                        {Object.entries(experiment.metrics).map(([key, value]) => (
                                            <Typography key={key} variant="body2" gutterBottom>
                                                {key}: {typeof value === 'number' ? value.toFixed(4) : value}
                                            </Typography>
                                        ))}
                                    </>
                                )}
                                {index < experiments.experiments.length - 1 && <Divider sx={{ my: 2 }} />}
                            </Box>
                        ))
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            No experiment results available
                        </Typography>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
};

export default ResultsViewer;
