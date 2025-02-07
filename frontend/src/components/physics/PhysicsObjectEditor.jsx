
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    Grid,
    Slider,
    Switch,
    TextField,
    Typography,
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';


export const PhysicsObjectEditor: React.FC = ({
    object,
    onClose,
    onSave,
}) => {
    const [formData, setFormData] = useState<Partial>({});

    useEffect(() => {
        if (object) {
            setFormData({
                name: object.name,
                position: object.position,
                rotation: object.rotation,
                scale: object.scale,
                mass: object.mass,
                isStatic: object.isStatic,
                isTrigger: object.isTrigger,
                material: {
                    friction: object.material.friction,
                    restitution: object.material.restitution,
                },
            });
        }
    }, [object]);

    const handleVectorChange = useCallback(
        (field: 'position' | 'rotation' | 'scale', index: number, value: number) => {
            setFormData((prev) => ({
                ...prev,
                [field]: prev[field]?.map((v, i) => (i === index ? value : v)),
            }));
        },
        []
    );

    const handleSave = useCallback(() => {
        if (object && formData) {
            onSave(object.id, formData);
            onClose();
        }
    }, [object, formData, onSave, onClose]);

    if (!object) return null;

    return (
        <Dialog open={!!object} onClose={onClose} maxWidth="md" fullWidth>
            Edit Physics Object</DialogTitle>
            
                <Box sx={{ pt: 2 }}>
                    <TextField
                        fullWidth
                        label="Name"
                        value={formData.name || ''}
                        onChange={(e) =>
                            setFormData((prev) => ({ ...prev, name: e.target.value }))
                        }
                        sx={{ mb: 3 }}
                    />

                    <Grid container spacing={3}>
                        {/* Position */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" gutterBottom>
                                Position
                            </Typography>
                            {['X', 'Y', 'Z'].map((axis, index) => (
                                <Box key={axis} sx={{ mb: 2 }}>
                                    <Typography variant="caption">{axis}</Typography>
                                    <Slider
                                        value={formData.position?.[index] || 0}
                                        min={-10}
                                        max={10}
                                        step={0.1}
                                        onChange={(_, value) =>
                                            handleVectorChange(
                                                'position',
                                                index,
                                                value as number
                                            )
                                        }
                                        valueLabelDisplay="auto"
                                    />
                                </Box>
                            ))}
                        </Grid>

                        {/* Rotation */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" gutterBottom>
                                Rotation
                            </Typography>
                            {['X', 'Y', 'Z'].map((axis, index) => (
                                <Box key={axis} sx={{ mb: 2 }}>
                                    <Typography variant="caption">{axis}</Typography>
                                    <Slider
                                        value={formData.rotation?.[index] || 0}
                                        min={0}
                                        max={360}
                                        step={1}
                                        onChange={(_, value) =>
                                            handleVectorChange(
                                                'rotation',
                                                index,
                                                value as number
                                            )
                                        }
                                        valueLabelDisplay="auto"
                                    />
                                </Box>
                            ))}
                        </Grid>

                        {/* Scale */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" gutterBottom>
                                Scale
                            </Typography>
                            {['X', 'Y', 'Z'].map((axis, index) => (
                                <Box key={axis} sx={{ mb: 2 }}>
                                    <Typography variant="caption">{axis}</Typography>
                                    <Slider
                                        value={formData.scale?.[index] || 1}
                                        min={0.1}
                                        max={5}
                                        step={0.1}
                                        onChange={(_, value) =>
                                            handleVectorChange(
                                                'scale',
                                                index,
                                                value as number
                                            )
                                        }
                                        valueLabelDisplay="auto"
                                    />
                                </Box>
                            ))}
                        </Grid>

                        {/* Physics Properties */}
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle1" gutterBottom>
                                Physics Properties
                            </Typography>
                            <TextField
                                fullWidth
                                type="number"
                                label="Mass (kg)"
                                value={formData.mass || 0}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        mass: parseFloat(e.target.value),
                                    }))
                                }
                                sx={{ mb: 2 }}
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.isStatic || false}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                isStatic: e.target.checked,
                                            }))
                                        }
                                    />
                                }
                                label="Static Object"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.isTrigger || false}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                isTrigger: e.target.checked,
                                            }))
                                        }
                                    />
                                }
                                label="Trigger"
                            />
                        </Grid>

                        {/* Material Properties */}
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle1" gutterBottom>
                                Material Properties
                            </Typography>
                            <TextField
                                fullWidth
                                type="number"
                                label="Friction"
                                value={formData.material?.friction || 0}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        material: {
                                            ...prev.material!,
                                            friction: parseFloat(e.target.value),
                                        },
                                    }))
                                }
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                fullWidth
                                type="number"
                                label="Restitution"
                                value={formData.material?.restitution || 0}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        material: {
                                            ...prev.material!,
                                            restitution: parseFloat(e.target.value),
                                        },
                                    }))
                                }
                            />
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>
            
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} variant="contained">
                    Save Changes
                </Button>
            </DialogActions>
        </Dialog>
    );
};
