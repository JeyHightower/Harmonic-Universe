import { useVisualization } from '@/hooks/useVisualization';
import { StreamConfig, Visualization } from '@/types/visualization';
import {
    Box,
    Button,
    Card,
    CardContent,
    Divider,
    Grid,
    MenuItem,
    TextField,
    Typography,
} from '@mui/material';
import React from 'react';

interface StreamConfigPanelProps {
    visualization: Visualization;
}

const StreamConfigPanel: React.FC<StreamConfigPanelProps> = ({ visualization }) => {
    const { updateConfig } = useVisualization();
    const [config, setConfig] = React.useState<StreamConfig>(
        visualization.streamConfig || {
            streamType: 'websocket',
            bufferSize: 1024,
            sampleRate: 44100,
            connectionSettings: {},
            processingPipeline: [],
        }
    );

    const handleConfigChange = (key: keyof StreamConfig, value: any) => {
        setConfig(prev => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleConnectionSettingChange = (key: string, value: any) => {
        setConfig(prev => ({
            ...prev,
            connectionSettings: {
                ...prev.connectionSettings,
                [key]: value,
            },
        }));
    };

    const handleSave = async () => {
        try {
            await updateConfig(visualization.id, config);
        } catch (error) {
            console.error('Failed to update stream configuration:', error);
        }
    };

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Stream Configuration
                </Typography>
                <Divider sx={{ my: 2 }} />

                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            select
                            label="Stream Type"
                            value={config.streamType}
                            onChange={e => handleConfigChange('streamType', e.target.value)}
                            margin="normal"
                        >
                            <MenuItem value="websocket">WebSocket</MenuItem>
                            <MenuItem value="midi">MIDI</MenuItem>
                            <MenuItem value="audio">Audio</MenuItem>
                            <MenuItem value="custom">Custom</MenuItem>
                        </TextField>
                    </Grid>

                    <Grid item xs={6}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Buffer Size"
                            value={config.bufferSize}
                            onChange={e => handleConfigChange('bufferSize', parseInt(e.target.value))}
                            margin="normal"
                        />
                    </Grid>

                    <Grid item xs={6}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Sample Rate"
                            value={config.sampleRate}
                            onChange={e => handleConfigChange('sampleRate', parseInt(e.target.value))}
                            margin="normal"
                        />
                    </Grid>
                </Grid>

                <Box mt={3}>
                    <Typography variant="subtitle1" gutterBottom>
                        Connection Settings
                    </Typography>
                    {config.streamType === 'websocket' && (
                        <>
                            <TextField
                                fullWidth
                                label="WebSocket URL"
                                value={config.connectionSettings.url || ''}
                                onChange={e => handleConnectionSettingChange('url', e.target.value)}
                                margin="normal"
                            />
                            <TextField
                                fullWidth
                                label="Protocol"
                                value={config.connectionSettings.protocol || ''}
                                onChange={e => handleConnectionSettingChange('protocol', e.target.value)}
                                margin="normal"
                            />
                        </>
                    )}

                    {config.streamType === 'midi' && (
                        <TextField
                            fullWidth
                            label="Device ID"
                            value={config.connectionSettings.deviceId || ''}
                            onChange={e => handleConnectionSettingChange('deviceId', e.target.value)}
                            margin="normal"
                        />
                    )}

                    {config.streamType === 'custom' && (
                        <Box mt={2}>
                            {Object.entries(config.connectionSettings).map(([key, value]) => (
                                <TextField
                                    key={key}
                                    fullWidth
                                    label={key}
                                    value={value}
                                    onChange={e => handleConnectionSettingChange(key, e.target.value)}
                                    margin="normal"
                                />
                            ))}
                            <Button
                                variant="outlined"
                                onClick={() =>
                                    handleConnectionSettingChange(`setting_${Date.now()}`, '')
                                }
                                sx={{ mt: 1 }}
                            >
                                Add Custom Setting
                            </Button>
                        </Box>
                    )}
                </Box>

                <Box mt={3}>
                    <Button variant="contained" color="primary" onClick={handleSave} fullWidth>
                        Save Configuration
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );
};

export default StreamConfigPanel;
