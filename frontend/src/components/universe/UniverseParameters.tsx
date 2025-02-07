import { Universe } from '@/store/slices/universeSlice';
import {
    Box,
    Card,
    CardContent,
    Grid,
    Slider,
    Typography
} from '@mui/material';
import React, { useCallback } from 'react';

interface UniverseParametersProps {
    universe: Universe;
    onUpdate: (universeId: number, updates: Partial<Universe['physicsParams']>) => void;
}

export const UniverseParameters: React.FC<UniverseParametersProps> = ({
    universe,
    onUpdate,
}) => {
    const handlePhysicsChange = useCallback(
        (param: keyof Universe['physicsParams'], value: number) => {
            onUpdate(universe.id, { [param]: value });
        },
        [universe.id, onUpdate]
    );

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Physics Parameters
            </Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle1" gutterBottom>
                                Gravity
                            </Typography>
                            <Slider
                                value={universe.physicsParams.gravity}
                                min={0}
                                max={20}
                                step={0.1}
                                onChange={(_, value) =>
                                    handlePhysicsChange('gravity', value as number)
                                }
                                valueLabelDisplay="auto"
                                marks={[
                                    { value: 0, label: '0' },
                                    { value: 9.81, label: 'Earth' },
                                    { value: 20, label: '20' },
                                ]}
                            />
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle1" gutterBottom>
                                Friction
                            </Typography>
                            <Slider
                                value={universe.physicsParams.friction}
                                min={0}
                                max={1}
                                step={0.01}
                                onChange={(_, value) =>
                                    handlePhysicsChange('friction', value as number)
                                }
                                valueLabelDisplay="auto"
                            />
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle1" gutterBottom>
                                Elasticity
                            </Typography>
                            <Slider
                                value={universe.physicsParams.elasticity}
                                min={0}
                                max={1}
                                step={0.01}
                                onChange={(_, value) =>
                                    handlePhysicsChange('elasticity', value as number)
                                }
                                valueLabelDisplay="auto"
                            />
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle1" gutterBottom>
                                Air Resistance
                            </Typography>
                            <Slider
                                value={universe.physicsParams.airResistance}
                                min={0}
                                max={1}
                                step={0.01}
                                onChange={(_, value) =>
                                    handlePhysicsChange('airResistance', value as number)
                                }
                                valueLabelDisplay="auto"
                            />
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle1" gutterBottom>
                                Time Dilation
                            </Typography>
                            <Slider
                                value={universe.physicsParams.timeDilation}
                                min={0.1}
                                max={2}
                                step={0.1}
                                onChange={(_, value) =>
                                    handlePhysicsChange('timeDilation', value as number)
                                }
                                valueLabelDisplay="auto"
                                marks={[
                                    { value: 0.1, label: 'Slow' },
                                    { value: 1, label: 'Normal' },
                                    { value: 2, label: 'Fast' },
                                ]}
                            />
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};
