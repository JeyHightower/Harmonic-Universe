import { ExpandMore } from '@mui/icons-material';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Slider,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { RootState } from '@store/index';
import { updateObject } from '@store/slices/physicsSlice';
import React from 'react';
import { ChromePicker } from 'react-color';
import { useDispatch, useSelector } from 'react-redux';


const PropertiesPanel: React.FC = ({
    objectId,
    isSimulating,
}) => {
    const dispatch = useDispatch();
    const object = useSelector((state: RootState) =>
        state.physics.objects.find((obj) => obj.id === objectId)
    );

    if (!object) {
        return (
            <Box sx={{ p: 2 }}>
                <Typography variant="subtitle1" color="text.secondary">
                    Select an object to view properties
                </Typography>
            </Box>
        );
    }

    const handleChange = (
        path: string[],
        value: string | number | boolean | [number, number, number]
    ) => {
        const update = path.reduceRight(
            (acc, key) => ({ [key]: acc }),
            value
        ) as any;
        dispatch(updateObject({ id: object.id, ...update }));
    };

    const handleVectorChange = (
        path: string[],
        index: number,
        value: number
    ) => {
        const currentVector = path.reduce(
            (obj, key) => obj[key],
            object as any
        ) as number[];
        const newVector = [...currentVector];
        newVector[index] = value;
        handleChange(path, newVector as [number, number, number]);
    };

    return (
        <Box sx={{ height: '100%', overflow: 'auto', p: 2 }}>
            <Typography variant="h6" gutterBottom>
                Properties
            </Typography>

            <Stack spacing={2}>
                <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                        Transform</Typography>
                    </AccordionSummary>
                    
                        <Stack spacing={2}>
                            
                                <Typography variant="subtitle2" gutterBottom>
                                    Position
                                </Typography>
                                <Stack direction="row" spacing={1}>
                                    {['X', 'Y', 'Z'].map((axis, i) => (
                                        <TextField
                                            key={axis}
                                            label={axis}
                                            type="number"
                                            size="small"
                                            value={object.position[i]}
                                            onChange={(e) =>
                                                handleVectorChange(
                                                    ['position'],
                                                    i,
                                                    parseFloat(e.target.value)
                                                )
                                            }
                                            disabled={isSimulating}
                                        />
                                    ))}
                                </Stack>
                            </Box>

                            
                                <Typography variant="subtitle2" gutterBottom>
                                    Rotation
                                </Typography>
                                <Stack direction="row" spacing={1}>
                                    {['X', 'Y', 'Z'].map((axis, i) => (
                                        <TextField
                                            key={axis}
                                            label={axis}
                                            type="number"
                                            size="small"
                                            value={object.rotation[i]}
                                            onChange={(e) =>
                                                handleVectorChange(
                                                    ['rotation'],
                                                    i,
                                                    parseFloat(e.target.value)
                                                )
                                            }
                                            disabled={isSimulating}
                                        />
                                    ))}
                                </Stack>
                            </Box>

                            
                                <Typography variant="subtitle2" gutterBottom>
                                    Scale
                                </Typography>
                                <Stack direction="row" spacing={1}>
                                    {['X', 'Y', 'Z'].map((axis, i) => (
                                        <TextField
                                            key={axis}
                                            label={axis}
                                            type="number"
                                            size="small"
                                            value={object.scale[i]}
                                            onChange={(e) =>
                                                handleVectorChange(
                                                    ['scale'],
                                                    i,
                                                    parseFloat(e.target.value)
                                                )
                                            }
                                        />
                                    ))}
                                </Stack>
                            </Box>
                        </Stack>
                    </AccordionDetails>
                </Accordion>

                
                    <AccordionSummary expandIcon={<ExpandMore />}>
                        Physics</Typography>
                    </AccordionSummary>
                    
                        <Stack spacing={2}>
                            <FormControl fullWidth size="small">
                                Type</InputLabel>
                                <Select
                                    value={object.physics.type}
                                    label="Type"
                                    onChange={(e) =>
                                        handleChange(['physics', 'type'], e.target.value)
                                    }
                                    disabled={isSimulating}
                                >
                                    <MenuItem value="dynamic">Dynamic</MenuItem>
                                    <MenuItem value="static">Static</MenuItem>
                                    <MenuItem value="kinematic">Kinematic</MenuItem>
                                </Select>
                            </FormControl>

                            
                                <Typography gutterBottom>Mass</Typography>
                                <TextField
                                    type="number"
                                    size="small"
                                    value={object.mass}
                                    onChange={(e) =>
                                        handleChange(['mass'], parseFloat(e.target.value))
                                    }
                                    disabled={isSimulating || object.physics.type === 'static'}
                                    fullWidth
                                />
                            </Box>

                            
                                <Typography gutterBottom>Restitution</Typography>
                                <Slider
                                    value={object.physics.restitution || 0}
                                    min={0}
                                    max={1}
                                    step={0.1}
                                    onChange={(_, value) =>
                                        handleChange(['physics', 'restitution'], value as number)
                                    }
                                    disabled={isSimulating}
                                    valueLabelDisplay="auto"
                                />
                            </Box>

                            
                                <Typography gutterBottom>Friction</Typography>
                                <Slider
                                    value={object.physics.friction || 0}
                                    min={0}
                                    max={1}
                                    step={0.1}
                                    onChange={(_, value) =>
                                        handleChange(['physics', 'friction'], value as number)
                                    }
                                    disabled={isSimulating}
                                    valueLabelDisplay="auto"
                                />
                            </Box>
                        </Stack>
                    </AccordionDetails>
                </Accordion>

                
                    <AccordionSummary expandIcon={<ExpandMore />}>
                        Material</Typography>
                    </AccordionSummary>
                    
                        <Stack spacing={2}>
                            
                                <Typography gutterBottom>Color</Typography>
                                <ChromePicker
                                    color={object.material.color}
                                    onChange={(color) =>
                                        handleChange(['material', 'color'], color.hex)
                                    }
                                />
                            </Box>

                            
                                <Typography gutterBottom>Metalness</Typography>
                                <Slider
                                    value={object.material.metalness || 0}
                                    min={0}
                                    max={1}
                                    step={0.1}
                                    onChange={(_, value) =>
                                        handleChange(['material', 'metalness'], value as number)
                                    }
                                    valueLabelDisplay="auto"
                                />
                            </Box>

                            
                                <Typography gutterBottom>Roughness</Typography>
                                <Slider
                                    value={object.material.roughness || 1}
                                    min={0}
                                    max={1}
                                    step={0.1}
                                    onChange={(_, value) =>
                                        handleChange(['material', 'roughness'], value as number)
                                    }
                                    valueLabelDisplay="auto"
                                />
                            </Box>
                        </Stack>
                    </AccordionDetails>
                </Accordion>
            </Stack>
        </Box>
    );
};

export default PropertiesPanel;
