import { Universe } from '@/store/slices/universeSlice';
import {
    Box,
    Card,
    CardContent,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    Slider,
    Typography,
} from '@mui/material';
import { useState } from 'react';


const COLOR_SCHEMES = [
    'Spectrum',
    'Monochrome',
    'Complementary',
    'Triadic',
    'Analogous',
    'Custom',
];

const BLEND_MODES = [
    'Normal',
    'Add',
    'Multiply',
    'Screen',
    'Overlay',
    'Soft Light',
    'Hard Light',
];

export const VisualizationControl = ({
    value,
    onChange,
}: VisualizationControlProps) => {
    const [localValue, setLocalValue] = useState(value);

    const handleChange = (
        param: keyof Universe['visualizationParams'],
        newValue: any
    ) => {
        const updatedValue = {
            ...localValue,
            [param]: newValue,
        };
        setLocalValue(updatedValue);
        onChange({ [param]: newValue });
    };

    return (
        
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    
                        
                            <Typography variant="h6" gutterBottom>
                                Particle System
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="body2" gutterBottom>
                                        Particle Count
                                    </Typography>
                                    <Slider
                                        value={localValue.particleCount}
                                        min={100}
                                        max={10000}
                                        step={100}
                                        onChange={(_, value) =>
                                            handleChange(
                                                'particleCount',
                                                value as number
                                            )
                                        }
                                        valueLabelDisplay="auto"
                                        marks={[
                                            { value: 100, label: '100' },
                                            { value: 5000, label: '5K' },
                                            { value: 10000, label: '10K' },
                                        ]}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="body2" gutterBottom>
                                        Particle Size
                                    </Typography>
                                    <Slider
                                        value={localValue.particleSize}
                                        min={1}
                                        max={20}
                                        step={0.5}
                                        onChange={(_, value) =>
                                            handleChange(
                                                'particleSize',
                                                value as number
                                            )
                                        }
                                        valueLabelDisplay="auto"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="body2" gutterBottom>
                                        Trail Length
                                    </Typography>
                                    <Slider
                                        value={localValue.trailLength}
                                        min={0}
                                        max={100}
                                        step={1}
                                        onChange={(_, value) =>
                                            handleChange(
                                                'trailLength',
                                                value as number
                                            )
                                        }
                                        valueLabelDisplay="auto"
                                    />
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                    
                        
                            <Typography variant="h6" gutterBottom>
                                Visual Style
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <FormControl fullWidth>
                                        Color Scheme</InputLabel>
                                        <Select
                                            value={localValue.colorScheme}
                                            onChange={(e) =>
                                                handleChange(
                                                    'colorScheme',
                                                    e.target.value
                                                )
                                            }
                                            label="Color Scheme"
                                        >
                                            {COLOR_SCHEMES.map((scheme) => (
                                                <MenuItem
                                                    key={scheme}
                                                    value={scheme}
                                                >
                                                    {scheme}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12}>
                                    <FormControl fullWidth>
                                        Blend Mode</InputLabel>
                                        <Select
                                            value={localValue.blendMode}
                                            onChange={(e) =>
                                                handleChange(
                                                    'blendMode',
                                                    e.target.value
                                                )
                                            }
                                            label="Blend Mode"
                                        >
                                            {BLEND_MODES.map((mode) => (
                                                <MenuItem
                                                    key={mode}
                                                    value={mode}
                                                >
                                                    {mode}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="body2" gutterBottom>
                                        Render Quality
                                    </Typography>
                                    <Slider
                                        value={localValue.renderQuality}
                                        min={0.1}
                                        max={1}
                                        step={0.1}
                                        onChange={(_, value) =>
                                            handleChange(
                                                'renderQuality',
                                                value as number
                                            )
                                        }
                                        valueLabelDisplay="auto"
                                        marks={[
                                            {
                                                value: 0.1,
                                                label: 'Performance',
                                            },
                                            {
                                                value: 0.5,
                                                label: 'Balanced',
                                            },
                                            {
                                                value: 1,
                                                label: 'Quality',
                                            },
                                        ]}
                                    />
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default VisualizationControl;
