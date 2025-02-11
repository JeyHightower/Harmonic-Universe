import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {
    Box,
    Button,
    Grid,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Paper,
    Slider,
    Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { useAIService } from '../../hooks/useAIService';
import { PhysicsConstraint, PhysicsObject, Scene } from '../../types/scene';

interface PhysicsEditorProps {
    scene: Scene | null;
    onUpdate: (updates: any) => void;
}

const PhysicsEditor: React.FC<PhysicsEditorProps> = ({ scene, onUpdate }) => {
    const [selectedObject, setSelectedObject] = useState<PhysicsObject | null>(null);
    const [selectedConstraint, setSelectedConstraint] = useState<PhysicsConstraint | null>(null);
    const { optimizePhysics } = useAIService();

    const handleParameterChange = (parameter: string, value: number) => {
        if (selectedObject) {
            onUpdate({
                objectId: selectedObject.id,
                parameters: {
                    ...selectedObject.parameters,
                    [parameter]: value,
                },
            });
        }
    };

    const handleOptimize = async () => {
        if (scene) {
            const optimizedParams = await optimizePhysics(scene.id);
            if (optimizedParams) {
                onUpdate({ physics: optimizedParams });
            }
        }
    };

    return (
        <Grid container spacing={2}>
            <Grid item xs={4}>
                <Paper sx={{ p: 2 }}>
                    <Typography variant="h6">Objects</Typography>
                    <List>
                        {scene?.physicsObjects.map((obj) => (
                            <ListItem
                                key={obj.id}
                                selected={selectedObject?.id === obj.id}
                                onClick={() => setSelectedObject(obj)}
                                secondaryAction={
                                    <IconButton edge="end" onClick={() => {
                                        onUpdate({ deleteObject: obj.id });
                                    }}>
                                        <DeleteIcon />
                                    </IconButton>
                                }
                            >
                                <ListItemText primary={obj.name} />
                            </ListItem>
                        ))}
                    </List>
                    <Button
                        startIcon={<AddIcon />}
                        onClick={() => {
                            onUpdate({
                                addObject: {
                                    name: 'New Object',
                                    type: 'circle',
                                    position: { x: 0, y: 0 },
                                },
                            });
                        }}
                    >
                        Add Object
                    </Button>
                </Paper>
            </Grid>

            <Grid item xs={8}>
                {selectedObject && (
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6">Properties</Typography>
                        <Box sx={{ mt: 2 }}>
                            <Typography gutterBottom>Mass</Typography>
                            <Slider
                                value={selectedObject.mass}
                                onChange={(_, value) => handleParameterChange('mass', value as number)}
                                min={0.1}
                                max={10}
                                step={0.1}
                                valueLabelDisplay="auto"
                            />

                            <Typography gutterBottom>Restitution</Typography>
                            <Slider
                                value={selectedObject.restitution}
                                onChange={(_, value) => handleParameterChange('restitution', value as number)}
                                min={0}
                                max={1}
                                step={0.1}
                                valueLabelDisplay="auto"
                            />

                            <Typography gutterBottom>Friction</Typography>
                            <Slider
                                value={selectedObject.friction}
                                onChange={(_, value) => handleParameterChange('friction', value as number)}
                                min={0}
                                max={1}
                                step={0.1}
                                valueLabelDisplay="auto"
                            />
                        </Box>
                    </Paper>
                )}

                <Box sx={{ mt: 2 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleOptimize}
                    >
                        Optimize Physics
                    </Button>
                </Box>
            </Grid>
        </Grid>
    );
};

export default PhysicsEditor;
