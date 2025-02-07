import { usePhysics } from '@/hooks/usePhysics';
import { PhysicsObject } from '@/types/physics';
import {
    Delete as DeleteIcon,
    Edit as EditIcon,
    PlayArrow as PlayArrowIcon,
    Stop as StopIcon,
} from '@mui/icons-material';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    IconButton,
    InputLabel,
    List,
    ListItem,
    ListItemSecondaryAction,
    ListItemText,
    MenuItem,
    Select,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';

interface PhysicsObjectListProps {
    projectId: number;
}

export const PhysicsObjectList: React.FC<PhysicsObjectListProps> = ({ projectId }) => {
    const {
        objects,
        loading,
        error,
        isSimulating,
        fetchPhysicsObjects,
        createPhysicsObject,
        deletePhysicsObject,
        startSimulation,
        stopSimulation,
    } = usePhysics(projectId);

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        type: 'sphere' as PhysicsObject['type'],
        mass: 1,
        isStatic: false,
        material: {
            friction: 0.5,
            restitution: 0.5,
        },
    });

    useEffect(() => {
        fetchPhysicsObjects();
    }, [fetchPhysicsObjects]);

    const handleCreateDialogOpen = () => {
        setIsCreateDialogOpen(true);
    };

    const handleCreateDialogClose = () => {
        setIsCreateDialogOpen(false);
        setFormData({
            name: '',
            type: 'sphere',
            mass: 1,
            isStatic: false,
            material: {
                friction: 0.5,
                restitution: 0.5,
            },
        });
    };

    const handleCreate = async () => {
        await createPhysicsObject(formData);
        handleCreateDialogClose();
    };

    const handleDelete = async (objectId: number) => {
        await deletePhysicsObject(objectId);
    };

    if (loading) {
        return <Typography>Loading physics objects...</Typography>;
    }

    if (error) {
        return <Typography color="error">Error: {error}</Typography>;
    }

    if (!objects.length) {
        return (
            <Box>
                <Typography sx={{ mb: 2 }}>No physics objects available</Typography>
                <Button variant="contained" onClick={handleCreateDialogOpen}>
                    Create Object
                </Button>
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button variant="contained" onClick={handleCreateDialogOpen}>
                    Create Object
                </Button>
                <Button
                    variant="outlined"
                    startIcon={isSimulating ? <StopIcon /> : <PlayArrowIcon />}
                    onClick={() => (isSimulating ? stopSimulation() : startSimulation())}
                >
                    {isSimulating ? 'Stop Simulation' : 'Start Simulation'}
                </Button>
            </Box>

            <List>
                {objects.map((object) => (
                    <ListItem key={object.id}>
                        <ListItemText
                            primary={object.name}
                            secondary={`Type: ${object.type} | Mass: ${object.mass}kg`}
                        />
                        <ListItemSecondaryAction>
                            <Tooltip title="Edit">
                                <IconButton>
                                    <EditIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                                <IconButton onClick={() => handleDelete(object.id)}>
                                    <DeleteIcon />
                                </IconButton>
                            </Tooltip>
                        </ListItemSecondaryAction>
                    </ListItem>
                ))}
            </List>

            <Dialog open={isCreateDialogOpen} onClose={handleCreateDialogClose}>
                <DialogTitle>Create Physics Object</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <TextField
                            fullWidth
                            label="Name"
                            value={formData.name}
                            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                            sx={{ mb: 2 }}
                        />
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Type</InputLabel>
                            <Select
                                value={formData.type}
                                label="Type"
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        type: e.target.value as PhysicsObject['type'],
                                    }))
                                }
                            >
                                <MenuItem value="sphere">Sphere</MenuItem>
                                <MenuItem value="box">Box</MenuItem>
                                <MenuItem value="plane">Plane</MenuItem>
                                <MenuItem value="cylinder">Cylinder</MenuItem>
                                <MenuItem value="cone">Cone</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            fullWidth
                            type="number"
                            label="Mass (kg)"
                            value={formData.mass}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, mass: parseFloat(e.target.value) }))
                            }
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            fullWidth
                            type="number"
                            label="Friction"
                            value={formData.material.friction}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    material: {
                                        ...prev.material,
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
                            value={formData.material.restitution}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    material: {
                                        ...prev.material,
                                        restitution: parseFloat(e.target.value),
                                    },
                                }))
                            }
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCreateDialogClose}>Cancel</Button>
                    <Button onClick={handleCreate} disabled={!formData.name}>
                        Create
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
