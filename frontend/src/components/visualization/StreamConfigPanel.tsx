import {
    Box,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Switch,
    TextField,
    Typography,
} from '@mui/material';
import { updateVisualization } from '@store/slices/visualizationSlice';
import React from 'react';
import { useDispatch } from 'react-redux';

interface StreamConfigPanelProps {
    visualization: {
        id: number;
        is_real_time: boolean;
        update_interval: number;
        stream_config?: {
            stream_type: string;
            buffer_size: number;
            sample_rate: number;
            connection_settings: {
                [key: string]: any;
            };
            processing_pipeline: Array<{
                type: string;
                params: {
                    [key: string]: any;
                };
            }>;
        };
    } | null;
}

const STREAM_TYPES = [
    { value: 'websocket', label: 'WebSocket' },
    { value: 'sse', label: 'Server-Sent Events' },
    { value: 'polling', label: 'HTTP Polling' },
];

const StreamConfigPanel: React.FC<StreamConfigPanelProps> = ({ visualization }) => {
    const dispatch = useDispatch();

    if (!visualization) {
        return (
            <Box sx={{ p: 2 }}>
                <Typography variant="subtitle1" color="text.secondary">
                    Select a visualization to configure streaming
                </Typography>
            </Box>
        );
    }

    const handleUpdateConfig = (field: string, value: any) => {
        dispatch(
            updateVisualization({
                id: visualization.id,
                stream_config: {
                    ...(visualization.stream_config || {}),
                    [field]: value,
                },
            })
        );
    };

    const handleToggleRealTime = () => {
        dispatch(
            updateVisualization({
                id: visualization.id,
                is_real_time: !visualization.is_real_time,
            })
        );
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
            <Stack spacing={3}>
                <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    justifyContent="space-between"
                >
                    <Typography variant="h6">Stream Configuration</Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Typography>Real-time</Typography>
                        <Switch
                            checked={visualization.is_real_time}
                            onChange={handleToggleRealTime}
                        />
                    </Stack>
                </Stack>

                {visualization.is_real_time && (
                    <>
                        <FormControl fullWidth size="small">
                            <InputLabel>Stream Type</InputLabel>
                            <Select
                                value={visualization.stream_config?.stream_type || 'websocket'}
                                onChange={(e) => handleUpdateConfig('stream_type', e.target.value)}
                                label="Stream Type"
                            >
                                {STREAM_TYPES.map((type) => (
                                    <MenuItem key={type.value} value={type.value}>
                                        {type.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Box>
                            <Typography gutterBottom>Update Interval (ms)</Typography>
                            <TextField
                                fullWidth
                                size="small"
                                type="number"
                                value={visualization.update_interval * 1000}
                                onChange={(e) =>
                                    dispatch(
                                        updateVisualization({
                                            id: visualization.id,
                                            update_interval: parseFloat(e.target.value) / 1000,
                                        })
                                    )
                                }
                                inputProps={{
                                    min: 16,
                                    max: 1000,
                                    step: 1,
                                }}
                            />
                        </Box>

                        <Box>
                            <Typography gutterBottom>Buffer Size</Typography>
                            <TextField
                                fullWidth
                                size="small"
                                type="number"
                                value={visualization.stream_config?.buffer_size || 1024}
                                onChange={(e) =>
                                    handleUpdateConfig('buffer_size', parseInt(e.target.value))
                                }
                                inputProps={{
                                    min: 64,
                                    max: 8192,
                                    step: 64,
                                }}
                            />
                        </Box>

                        <Box>
                            <Typography gutterBottom>Sample Rate (Hz)</Typography>
                            <TextField
                                fullWidth
                                size="small"
                                type="number"
                                value={visualization.stream_config?.sample_rate || 44100}
                                onChange={(e) =>
                                    handleUpdateConfig('sample_rate', parseInt(e.target.value))
                                }
                                inputProps={{
                                    min: 8000,
                                    max: 192000,
                                    step: 100,
                                }}
                            />
                        </Box>

                        {visualization.stream_config?.stream_type === 'websocket' && (
                            <Box>
                                <Typography gutterBottom>WebSocket URL</Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    value={
                                        visualization.stream_config?.connection_settings?.url ||
                                        'ws://localhost:8000/ws'
                                    }
                                    onChange={(e) =>
                                        handleUpdateConfig('connection_settings', {
                                            ...visualization.stream_config?.connection_settings,
                                            url: e.target.value,
                                        })
                                    }
                                />
                            </Box>
                        )}
                    </>
                )}
            </Stack>
        </Box>
    );
};

export default StreamConfigPanel;
