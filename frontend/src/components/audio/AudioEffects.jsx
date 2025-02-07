import DeleteIcon from '@mui/icons-material/Delete';
import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    Slider,
    Switch,
    Typography,
} from '@mui/material';
import { useCallback } from 'react';

const AVAILABLE_EFFECTS = [
    {
        type: 'eq',
        name: 'Equalizer',
        parameters: [
            { name: 'low', value: 0, min: -12, max: 12, step: 0.1 },
            { name: 'mid', value: 0, min: -12, max: 12, step: 0.1 },
            { name: 'high', value: 0, min: -12, max: 12, step: 0.1 },
        ],
    },
    {
        type: 'reverb',
        name: 'Reverb',
        parameters: [
            { name: 'mix', value: 0.5, min: 0, max: 1, step: 0.01 },
            { name: 'decay', value: 2, min: 0.1, max: 10, step: 0.1 },
        ],
    },
    {
        type: 'delay',
        name: 'Delay',
        parameters: [
            { name: 'time', value: 0.3, min: 0, max: 2, step: 0.01 },
            { name: 'feedback', value: 0.5, min: 0, max: 0.9, step: 0.01 },
            { name: 'mix', value: 0.5, min: 0, max: 1, step: 0.01 },
        ],
    },
    {
        type: 'compressor',
        name: 'Compressor',
        parameters: [
            { name: 'threshold', value: -24, min: -60, max: 0, step: 1 },
            { name: 'ratio', value: 4, min: 1, max: 20, step: 0.1 },
            { name: 'attack', value: 0.003, min: 0, max: 1, step: 0.001 },
            { name: 'release', value: 0.25, min: 0, max: 1, step: 0.01 },
        ],
    },
];

const AudioEffects = ({ effects, onEffectAdd, onEffectUpdate, onEffectDelete }) => {
    const handleAddEffect = useCallback(
        (type) => {
            const effectTemplate = AVAILABLE_EFFECTS.find((e) => e.type === type);
            if (effectTemplate) {
                const newEffect = {
                    id: `${type}-${Date.now()}`,
                    type: effectTemplate.type,
                    name: effectTemplate.name,
                    enabled: true,
                    parameters: effectTemplate.parameters,
                };
                onEffectAdd(newEffect);
            }
        },
        [onEffectAdd]
    );

    const handleParameterChange = useCallback(
        (effectId, paramName, value) => {
            const effect = effects.find((e) => e.id === effectId);
            if (effect) {
                const updatedParameters = effect.parameters.map((p) =>
                    p.name === paramName ? { ...p, value } : p
                );
                onEffectUpdate(effectId, { parameters: updatedParameters });
            }
        },
        [effects, onEffectUpdate]
    );

    const renderParameter = useCallback(
        (effect, param) => (
            <Box key={param.name} sx={{ mt: 2 }}>
                <Typography variant="caption" gutterBottom>
                    {param.name}
                </Typography>
                <Slider
                    value={param.value}
                    min={param.min}
                    max={param.max}
                    step={param.step}
                    onChange={(_, value) => handleParameterChange(effect.id, param.name, value)}
                    valueLabelDisplay="auto"
                />
            </Box>
        ),
        [handleParameterChange]
    );

    return (
        <Box>
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Add Effect</InputLabel>
                    <Select
                        label="Add Effect"
                        onChange={(e) => handleAddEffect(e.target.value)}
                        value=""
                    >
                        {AVAILABLE_EFFECTS.map((effect) => (
                            <MenuItem key={effect.type} value={effect.type}>
                                {effect.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Button startIcon={<AddIcon />} onClick={() => handleAddEffect('eq')}>
                    Add Effect
                </Button>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {effects.map((effect) => (
                    <Card key={effect.id}>
                        <CardHeader
                            title={effect.name}
                            action={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Switch
                                        checked={effect.enabled}
                                        onChange={(e) =>
                                            onEffectUpdate(effect.id, { enabled: e.target.checked })
                                        }
                                    />
                                    <IconButton
                                        size="small"
                                        onClick={() => onEffectDelete(effect.id)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Box>
                            }
                        />
                        <CardContent>
                            {effect.parameters.map((param) => renderParameter(effect, param))}
                        </CardContent>
                    </Card>
                ))}
            </Box>
        </Box>
    );
};

export default AudioEffects;
