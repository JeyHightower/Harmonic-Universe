import { useVisualization } from '@/hooks/useVisualization';
import { Visualization, VisualizationUpdateData } from '@/types/visualization';
import {
    Box,
    Button,
    Card,
    CardContent,
    Divider,
    FormControlLabel,
    Grid,
    Switch,
    TextField,
    Typography,
} from '@mui/material';
import React from 'react';

interface VisualizationSettingsProps {
    visualization: Visualization;
}

const VisualizationSettings: React.FC<VisualizationSettingsProps> = ({ visualization }) => {
    const { update } = useVisualization();
    const [settings, setSettings] = React.useState(visualization.settings);

    const handleSettingChange = (key: keyof typeof settings, value: any) => {
        setSettings(prev => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleSave = async () => {
        const updateData: VisualizationUpdateData = {
            settings,
        };
        try {
            await update(visualization.id, updateData);
        } catch (error) {
            console.error('Failed to update visualization settings:', error);
        }
    };

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Visualization Settings
                </Typography>
                <Divider sx={{ my: 2 }} />

                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <TextField
                            fullWidth
                            label="Width"
                            type="number"
                            value={settings.width}
                            onChange={e => handleSettingChange('width', parseInt(e.target.value))}
                            margin="normal"
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            fullWidth
                            label="Height"
                            type="number"
                            value={settings.height}
                            onChange={e => handleSettingChange('height', parseInt(e.target.value))}
                            margin="normal"
                        />
                    </Grid>
                </Grid>

                <Box mt={2}>
                    <TextField
                        fullWidth
                        label="Background Color"
                        type="color"
                        value={settings.backgroundColor}
                        onChange={e => handleSettingChange('backgroundColor', e.target.value)}
                        margin="normal"
                    />
                    <TextField
                        fullWidth
                        label="Foreground Color"
                        type="color"
                        value={settings.foregroundColor}
                        onChange={e => handleSettingChange('foregroundColor', e.target.value)}
                        margin="normal"
                    />
                </Box>

                <Box mt={2}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={settings.showAxes}
                                onChange={e => handleSettingChange('showAxes', e.target.checked)}
                            />
                        }
                        label="Show Axes"
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={settings.showGrid}
                                onChange={e => handleSettingChange('showGrid', e.target.checked)}
                            />
                        }
                        label="Show Grid"
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={settings.showLabels}
                                onChange={e => handleSettingChange('showLabels', e.target.checked)}
                            />
                        }
                        label="Show Labels"
                    />
                </Box>

                {visualization.type === 'custom' && settings.customSettings && (
                    <Box mt={2}>
                        <Typography variant="subtitle1" gutterBottom>
                            Custom Settings
                        </Typography>
                        {Object.entries(settings.customSettings).map(([key, value]) => (
                            <TextField
                                key={key}
                                fullWidth
                                label={key}
                                value={value}
                                onChange={e =>
                                    handleSettingChange('customSettings', {
                                        ...settings.customSettings,
                                        [key]: e.target.value,
                                    })
                                }
                                margin="normal"
                            />
                        ))}
                    </Box>
                )}

                <Box mt={3}>
                    <Button variant="contained" color="primary" onClick={handleSave} fullWidth>
                        Save Settings
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );
};

export default VisualizationSettings;
