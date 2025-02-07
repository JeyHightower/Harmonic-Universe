
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    DragHandle,
    Visibility,
    VisibilityOff,
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
    Stack,
    Typography,
} from '@mui/material';
import { addObject, deleteObject, updateObject } from '@store/slices/physicsSlice';
import { useAppDispatch, useAppSelector } from '@store/store';
import React, { useState } from 'react';
import { DragDropContext, Draggable, Droppable, DropResult } from 'react-beautiful-dnd';


const OBJECT_TEMPLATES: Record<string, Partial> = {
    box: {
        name: 'Box',
        shape: 'box',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        mass: 1,
        material: {
            friction: 0.5,
            restitution: 0.5,
            density: 1,
        },
        dimensions: [1, 1, 1],
        isStatic: false,
    },
    sphere: {
        name: 'Sphere',
        shape: 'sphere',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [0.5, 0.5, 0.5],
        mass: 1,
        material: {
            friction: 0.3,
            restitution: 0.7,
            density: 1,
        },
        dimensions: [1, 1, 1],
        isStatic: false,
    },
    cylinder: {
        name: 'Cylinder',
        shape: 'cylinder',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [0.5, 1, 0.5],
        mass: 1,
        material: {
            friction: 0.5,
            restitution: 0.5,
            density: 1,
        },
        dimensions: [1, 2, 1],
        isStatic: false,
    },
};

const ObjectList: React.FC = ({
    selectedObjectId,
    onObjectSelect,
}) => {
    const dispatch = useAppDispatch();
    const objects = useAppSelector(state => state.physics.objects);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleAddClick = (event: React.MouseEvent) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleAddObject = (type: keyof typeof OBJECT_TEMPLATES) => {
        const template = OBJECT_TEMPLATES[type];
        const position: [number, number, number] = [0, template.scale?.[1] || 0, 0];
        dispatch(
            addObject({
                ...template,
                position,
            })
        );
        handleMenuClose();
    };

    const handleDeleteObject = (objectId: number) => {
        dispatch(deleteObject({ objectId }));
        if (selectedObjectId === objectId) {
            onObjectSelect(-1);
        }
    };

    const handleToggleVisibility = (objectId: number, isVisible: boolean) => {
        dispatch(updateObject({ objectId, data: { isVisible: !isVisible } }));
    };

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const items = Array.from(objects);
        const [removed] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, removed);

        // Update object order in Redux
        items.forEach((item, index) => {
            dispatch(updateObject({ objectId: item.id, data: { order: index } }));
        });
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6">Objects</Typography>
                <IconButton onClick={handleAddClick} size="small">
                    <AddIcon />
                </IconButton>
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                >
                    <MenuItem onClick={() => handleAddObject('box')}>Box</MenuItem>
                    <MenuItem onClick={() => handleAddObject('sphere')}>Sphere</MenuItem>
                    <MenuItem onClick={() => handleAddObject('cylinder')}>Cylinder</MenuItem>
                </Menu>
            </Stack>

            <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="objects-list">
                    {(provided) => (
                        <List
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            sx={{ flexGrow: 1, overflow: 'auto' }}
                        >
                            {objects.map((object, index) => (
                                <Draggable
                                    key={object.id}
                                    draggableId={object.id.toString()}
                                    index={index}
                                >
                                    {(provided) => (
                                        <ListItem
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            selected={object.id === selectedObjectId}
                                            onClick={() => onObjectSelect(object.id)}
                                            sx={{
                                                cursor: 'pointer',
                                                '&:hover': {
                                                    backgroundColor: 'action.hover',
                                                },
                                            }}
                                        >
                                            <div {...provided.dragHandleProps}>
                                                <DragHandle sx={{ mr: 1 }} />
                                            </div>
                                            <ListItemText
                                                primary={`${object.name || object.shape} ${object.id}`}
                                                secondary={`Mass: ${object.mass}kg`}
                                            />
                                            
                                                <IconButton
                                                    edge="end"
                                                    onClick={() =>
                                                        handleToggleVisibility(object.id, object.isVisible || false)
                                                    }
                                                >
                                                    {object.isVisible ? <Visibility /> : <VisibilityOff />}
                                                </IconButton>
                                                <IconButton
                                                    edge="end"
                                                    onClick={() => handleDeleteObject(object.id)}
                                                    sx={{ ml: 1 }}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </ListItemSecondaryAction>
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

export default ObjectList;
