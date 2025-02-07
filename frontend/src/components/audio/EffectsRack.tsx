import {
    Add as AddIcon,
    Delete as DeleteIcon,
    DragHandle,
    PowerSettingsNew as PowerIcon,
} from '@mui/icons-material';
import {
    Box,
    IconButton,
    List,
    ListItem,
    ListItemSecondaryAction,
    ListItemText,
    Menu,
    MenuItem,
    Slider,
    Stack,
    Typography,
} from '@mui/material';
import { RootState } from '@store/index';
import { updateTrack } from '@store/slices/audioSlice';
import React, { useState } from 'react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { useDispatch, useSelector } from 'react-redux';

interface EffectsRackProps {
    trackId: number | null;
}

interface EffectParameter {
    name: string;
    value: number;
    min: number;
    max: number;
    step: number;
}

interface Effect {
    id: string;
    type: string;
    name: string;
    enabled: boolean;
    parameters: EffectParameter[];
}

const EFFECT_TEMPLATES = {
    eq: {
        type: 'eq',
        name: 'Equalizer',
        parameters: [
            { name: 'low', value: 0, min: -12, max: 12, step: 0.1 },
            { name: 'mid', value: 0, min: -12, max: 12, step: 0.1 },
            { name: 'high', value: 0, min: -12, max: 12, step: 0.1 },
        ],
    },
    compressor: {
        type: 'compressor',
        name: 'Compressor',
        parameters: [
            { name: 'threshold', value: -24, min: -60, max: 0, step: 1 },
            { name: 'ratio', value: 4, min: 1, max: 20, step: 0.1 },
            { name: 'attack', value: 0.003, min: 0, max: 1, step: 0.001 },
            { name: 'release', value: 0.25, min: 0, max: 1, step: 0.01 },
        ],
    },
    reverb: {
        type: 'reverb',
        name: 'Reverb',
        parameters: [
            { name: 'mix', value: 0.3, min: 0, max: 1, step: 0.01 },
            { name: 'decay', value: 2, min: 0.1, max: 10, step: 0.1 },
            { name: 'preDelay', value: 0.01, min: 0, max: 0.1, step: 0.001 },
        ],
    },
    delay: {
        type: 'delay',
        name: 'Delay',
        parameters: [
            { name: 'time', value: 0.25, min: 0, max: 1, step: 0.01 },
            { name: 'feedback', value: 0.3, min: 0, max: 0.9, step: 0.01 },
            { name: 'mix', value: 0.3, min: 0, max: 1, step: 0.01 },
        ],
    },
};

const EffectsRack: React.FC<EffectsRackProps> = ({ trackId }) => {
    const dispatch = useDispatch();
    const track = useSelector((state: RootState) =>
        state.audio.tracks.find((t) => t.id === trackId)
    );
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleAddClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleEffectAdd = (effectType: string) => {
        if (!track) return;

        const template = EFFECT_TEMPLATES[effectType as keyof typeof EFFECT_TEMPLATES];
        const newEffect: Effect = {
            id: `${effectType}_${Date.now()}`,
            type: template.type,
            name: template.name,
            enabled: true,
            parameters: [...template.parameters],
        };

        dispatch(
            updateTrack({
                id: track.id,
                effects: [...track.effects, newEffect],
            })
        );

        handleMenuClose();
    };

    const handleEffectRemove = (effectId: string) => {
        if (!track) return;

        dispatch(
            updateTrack({
                id: track.id,
                effects: track.effects.filter((effect) => effect.id !== effectId),
            })
        );
    };

    const handleEffectToggle = (effectId: string, enabled: boolean) => {
        if (!track) return;

        dispatch(
            updateTrack({
                id: track.id,
                effects: track.effects.map((effect) =>
                    effect.id === effectId ? { ...effect, enabled: !enabled } : effect
                ),
            })
        );
    };

    const handleParameterChange = (
        effectId: string,
        paramName: string,
        value: number
    ) => {
        if (!track) return;

        dispatch(
            updateTrack({
                id: track.id,
                effects: track.effects.map((effect) =>
                    effect.id === effectId
                        ? {
                            ...effect,
                            parameters: effect.parameters.map((param) =>
                                param.name === paramName ? { ...param, value } : param
                            ),
                        }
                        : effect
                ),
            })
        );
    };

    const handleDragEnd = (result: any) => {
        if (!result.destination || !track) return;

        const effects = Array.from(track.effects);
        const [removed] = effects.splice(result.source.index, 1);
        effects.splice(result.destination.index, 0, removed);

        dispatch(
            updateTrack({
                id: track.id,
                effects,
            })
        );
    };

    if (!track) {
        return (
            <Box sx={{ p: 2 }}>
                <Typography variant="subtitle1" color="text.secondary">
                    Select a track to view effects
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6">Effects</Typography>
                <IconButton onClick={handleAddClick} size="small">
                    <AddIcon />
                </IconButton>
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                >
                    <MenuItem onClick={() => handleEffectAdd('eq')}>Equalizer</MenuItem>
                    <MenuItem onClick={() => handleEffectAdd('compressor')}>
                        Compressor
                    </MenuItem>
                    <MenuItem onClick={() => handleEffectAdd('reverb')}>Reverb</MenuItem>
                    <MenuItem onClick={() => handleEffectAdd('delay')}>Delay</MenuItem>
                </Menu>
            </Stack>

            <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="effects-list">
                    {(provided) => (
                        <List
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            sx={{ flexGrow: 1, overflow: 'auto' }}
                        >
                            {track.effects.map((effect, index) => (
                                <Draggable
                                    key={effect.id}
                                    draggableId={effect.id}
                                    index={index}
                                >
                                    {(provided) => (
                                        <ListItem
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            sx={{
                                                flexDirection: 'column',
                                                alignItems: 'stretch',
                                                opacity: effect.enabled ? 1 : 0.5,
                                            }}
                                        >
                                            <Stack direction="row" alignItems="center">
                                                <div {...provided.dragHandleProps}>
                                                    <DragHandle sx={{ mr: 1 }} />
                                                </div>
                                                <ListItemText primary={effect.name} />
                                                <ListItemSecondaryAction>
                                                    <IconButton
                                                        edge="end"
                                                        onClick={() =>
                                                            handleEffectToggle(
                                                                effect.id,
                                                                effect.enabled
                                                            )
                                                        }
                                                    >
                                                        <PowerIcon
                                                            color={effect.enabled ? 'primary' : 'disabled'}
                                                        />
                                                    </IconButton>
                                                    <IconButton
                                                        edge="end"
                                                        onClick={() => handleEffectRemove(effect.id)}
                                                        sx={{ ml: 1 }}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </ListItemSecondaryAction>
                                            </Stack>
                                            <Box sx={{ px: 2, py: 1 }}>
                                                {effect.parameters.map((param) => (
                                                    <Box key={param.name} sx={{ mb: 1 }}>
                                                        <Typography
                                                            variant="caption"
                                                            color="text.secondary"
                                                        >
                                                            {param.name}
                                                        </Typography>
                                                        <Stack
                                                            direction="row"
                                                            spacing={2}
                                                            alignItems="center"
                                                        >
                                                            <Slider
                                                                size="small"
                                                                value={param.value}
                                                                min={param.min}
                                                                max={param.max}
                                                                step={param.step}
                                                                onChange={(_, value) =>
                                                                    handleParameterChange(
                                                                        effect.id,
                                                                        param.name,
                                                                        value as number
                                                                    )
                                                                }
                                                                disabled={!effect.enabled}
                                                            />
                                                            <Typography
                                                                variant="body2"
                                                                sx={{ minWidth: 50 }}
                                                            >
                                                                {param.value.toFixed(2)}
                                                            </Typography>
                                                        </Stack>
                                                    </Box>
                                                ))}
                                            </Box>
                                        </ListItem>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </List>
                    )}
                </Droppable>
            </DragDropContext>
        </Box>
    );
};

export default EffectsRack;
