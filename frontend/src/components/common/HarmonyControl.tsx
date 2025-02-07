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
    TextField,
    Typography,
} from '@mui/material';
import { useState } from 'react';

interface HarmonyControlProps {
    value: Universe['harmonyParams'];
    onChange: (params: Partial<Universe['harmonyParams']>) => void;
}

const SCALES = [
    'Major',
    'Minor',
    'Harmonic Minor',
    'Melodic Minor',
    'Dorian',
    'Phrygian',
    'Lydian',
    'Mixolydian',
    'Locrian',
    'Pentatonic Major',
    'Pentatonic Minor',
    'Blues',
];

const STYLES = [
    'Classical',
    'Jazz',
    'Electronic',
    'Ambient',
    'Experimental',
    'Minimalist',
];

export const HarmonyControl = ({ value, onChange }: HarmonyControlProps) => {
    const [localValue, setLocalValue] = useState(value);

    const handleChange = (
        param: keyof Universe['harmonyParams'],
        newValue: any
    ) => {
        const updatedValue = {
            ...localValue,
            [param]: newValue,
        };
        setLocalValue(updatedValue);
        onChange({ [param]: newValue });
    };

    const handleAIParamChange = (
        param: keyof Universe['harmonyParams']['aiGenerationParams'],
        newValue: any
    ) => {
        const updatedAIParams = {
            ...localValue.aiGenerationParams,
            [param]: newValue,
        };
        setLocalValue({
            ...localValue,
            aiGenerationParams: updatedAIParams,
        });
        onChange({
            aiGenerationParams: updatedAIParams,
        });
    };

    return (
        <Box>
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Base Parameters
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="body2" gutterBottom>
                                        Base Frequency (Hz)
                                    </Typography>
                                    <Slider
                                        value={localValue.baseFrequency}
                                        min={20}
                                        max={2000}
                                        step={1}
                                        onChange={(_, value) =>
                                            handleChange(
                                                'baseFrequency',
                                                value as number
                                            )
                                        }
                                        valueLabelDisplay="auto"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <FormControl fullWidth>
                                        <InputLabel>Scale</InputLabel>
                                        <Select
                                            value={localValue.scale}
                                            onChange={(e) =>
                                                handleChange('scale', e.target.value)
                                            }
                                            label="Scale"
                                        >
                                            {SCALES.map((scale) => (
                                                <MenuItem
                                                    key={scale}
                                                    value={scale}
                                                >
                                                    {scale}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="body2" gutterBottom>
                                        Tempo (BPM)
                                    </Typography>
                                    <Slider
                                        value={localValue.tempo}
                                        min={40}
                                        max={200}
                                        step={1}
                                        onChange={(_, value) =>
                                            handleChange('tempo', value as number)
                                        }
                                        valueLabelDisplay="auto"
                                    />
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Advanced Parameters
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="body2" gutterBottom>
                                        Resonance
                                    </Typography>
                                    <Slider
                                        value={localValue.resonance}
                                        min={0}
                                        max={1}
                                        step={0.01}
                                        onChange={(_, value) =>
                                            handleChange(
                                                'resonance',
                                                value as number
                                            )
                                        }
                                        valueLabelDisplay="auto"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="body2" gutterBottom>
                                        Damping
                                    </Typography>
                                    <Slider
                                        value={localValue.damping}
                                        min={0}
                                        max={1}
                                        step={0.01}
                                        onChange={(_, value) =>
                                            handleChange(
                                                'damping',
                                                value as number
                                            )
                                        }
                                        valueLabelDisplay="auto"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="body2" gutterBottom>
                                        Interference
                                    </Typography>
                                    <Slider
                                        value={localValue.interference}
                                        min={0}
                                        max={1}
                                        step={0.01}
                                        onChange={(_, value) =>
                                            handleChange(
                                                'interference',
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
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                AI Generation Parameters
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Style</InputLabel>
                                        <Select
                                            value={
                                                localValue.aiGenerationParams.style
                                            }
                                            onChange={(e) =>
                                                handleAIParamChange(
                                                    'style',
                                                    e.target.value
                                                )
                                            }
                                            label="Style"
                                        >
                                            {STYLES.map((style) => (
                                                <MenuItem
                                                    key={style}
                                                    value={style}
                                                >
                                                    {style}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="body2" gutterBottom>
                                        Complexity
                                    </Typography>
                                    <Slider
                                        value={
                                            localValue.aiGenerationParams
                                                .complexity
                                        }
                                        min={0}
                                        max={1}
                                        step={0.1}
                                        onChange={(_, value) =>
                                            handleAIParamChange(
                                                'complexity',
                                                value as number
                                            )
                                        }
                                        valueLabelDisplay="auto"
                                        marks={[
                                            { value: 0, label: 'Simple' },
                                            {
                                                value: 0.5,
                                                label: 'Moderate',
                                            },
                                            { value: 1, label: 'Complex' },
                                        ]}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="body2" gutterBottom>
                                        Intensity
                                    </Typography>
                                    <Slider
                                        value={
                                            localValue.aiGenerationParams
                                                .intensity
                                        }
                                        min={0}
                                        max={1}
                                        step={0.1}
                                        onChange={(_, value) =>
                                            handleAIParamChange(
                                                'intensity',
                                                value as number
                                            )
                                        }
                                        valueLabelDisplay="auto"
                                        marks={[
                                            { value: 0, label: 'Subtle' },
                                            {
                                                value: 0.5,
                                                label: 'Balanced',
                                            },
                                            { value: 1, label: 'Intense' },
                                        ]}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth>
                                        <TextField
                                            label="Mood"
                                            value={
                                                localValue.aiGenerationParams.mood
                                            }
                                            onChange={(e) =>
                                                handleAIParamChange(
                                                    'mood',
                                                    e.target.value
                                                )
                                            }
                                            placeholder="e.g., Calm, Energetic, Mysterious"
                                        />
                                    </FormControl>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default HarmonyControl;
