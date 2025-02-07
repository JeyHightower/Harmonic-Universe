import { Visualization } from '@/types/visualization';
import {
    Box,
    Checkbox,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Slider,
    TextField,
    Typography,
} from '@mui/material';
import { useCallback } from 'react';

interface VisualizationSettingsProps {
    visualization: Visualization;
    onSettingsChange: (settings: Record<string, any>) => void;
}

const VisualizationSettings = ({ visualization, onSettingsChange }: VisualizationSettingsProps) => {
    const handleSettingChange = useCallback(
        (key: string, value: any) => {
            onSettingsChange({
                ...visualization.settings,
                [key]: value,
            });
        },
        [visualization.settings, onSettingsChange]
    );

    const renderSettingControl = (key: string, setting: any) => {
        switch (typeof setting) {
            case 'boolean':
                return (
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={setting}
                                onChange={(e) => handleSettingChange(key, e.target.checked)}
                            />
                        }
                        label={key}
                    />
                );
            case 'number':
                if (key.includes('color') || key.includes('opacity')) {
                    return (
                        <Box sx={{ width: '100%', mt: 2 }}>
                            <Typography gutterBottom>{key}</Typography>
                            <Slider
                                value={setting}
                                min={0}
                                max={key.includes('opacity') ? 1 : 255}
                                step={key.includes('opacity') ? 0.01 : 1}
                                onChange={(_, value) => handleSettingChange(key, value)}
                            />
                        </Box>
                    );
                }
                return (
                    <TextField
                        fullWidth
                        label={key}
                        type="number"
                        value={setting}
                        onChange={(e) => handleSettingChange(key, parseFloat(e.target.value))}
                        sx={{ mt: 2 }}
                    />
                );
            case 'string':
                if (key === 'type' || key.includes('mode')) {
                    return (
                        <FormControl fullWidth sx={{ mt: 2 }}>
                            <InputLabel>{key}</InputLabel>
                            <Select
                                value={setting}
                                label={key}
                                onChange={(e) => handleSettingChange(key, e.target.value)}
                            >
                                <MenuItem value="waveform">Waveform</MenuItem>
                                <MenuItem value="frequency">Frequency</MenuItem>
                                <MenuItem value="circular">Circular</MenuItem>
                                <MenuItem value="3d">3D</MenuItem>
                            </Select>
                        </FormControl>
                    );
                }
                return (
                    <TextField
                        fullWidth
                        label={key}
                        value={setting}
                        onChange={(e) => handleSettingChange(key, e.target.value)}
                        sx={{ mt: 2 }}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
                Visualization Settings
            </Typography>
            <Box sx={{ mt: 2 }}>
                {Object.entries(visualization.settings).map(([key, value]) => (
                    <Box key={key}>{renderSettingControl(key, value)}</Box>
                ))}
            </Box>
            <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                    Real-time Settings
                </Typography>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={visualization.isRealTime}
                            onChange={(e) =>
                                onSettingsChange({
                                    ...visualization.settings,
                                    isRealTime: e.target.checked,
                                })
                            }
                        />
                    }
                    label="Enable Real-time Updates"
                />
                {visualization.isRealTime && (
                    <TextField
                        fullWidth
                        label="Update Interval (ms)"
                        type="number"
                        value={visualization.updateInterval}
                        onChange={(e) =>
                            onSettingsChange({
                                ...visualization.settings,
                                updateInterval: parseInt(e.target.value),
                            })
                        }
                        sx={{ mt: 2 }}
                    />
                )}
            </Box>
        </Paper>
    );
};

export default VisualizationSettings;
