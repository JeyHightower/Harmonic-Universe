import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import {
    Box,
    Button,
    Card,
    CardContent,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    List,
    ListItem,
    ListItemSecondaryAction,
    ListItemText,
    TextField,
    Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import {
    createScene,
    deleteScene,
    fetchScenes,
    reorderScenes,
    selectSceneError,
    selectSceneLoading,
    selectScenes,
    updateScene,
} from '../../store/slices/sceneSlice';

interface StoryboardEditorProps {
  universeId: number;
  storyboardId: number;
}

interface SceneDialogState {
  open: boolean;
  mode: 'create' | 'edit';
  sceneId?: number;
  title: string;
  content: Record<string, any>;
}

export const StoryboardEditor: React.FC<StoryboardEditorProps> = ({
  universeId,
  storyboardId,
}) => {
  const dispatch = useAppDispatch();
  const scenes = useAppSelector(selectScenes);
  const isLoading = useAppSelector(selectSceneLoading);
  const error = useAppSelector(selectSceneError);

  const [dialogState, setDialogState] = useState<SceneDialogState>({
    open: false,
    mode: 'create',
    title: '',
    content: {},
  });

  useEffect(() => {
    dispatch(fetchScenes({ universeId, storyboardId }));
  }, [dispatch, universeId, storyboardId]);

  const handleCreateScene = () => {
    setDialogState({
      open: true,
      mode: 'create',
      title: '',
      content: {},
    });
  };

  const handleEditScene = (scene: any) => {
    setDialogState({
      open: true,
      mode: 'edit',
      sceneId: scene.id,
      title: scene.title,
      content: scene.content,
    });
  };

  const handleDeleteScene = async (sceneId: number) => {
    if (window.confirm('Are you sure you want to delete this scene?')) {
      await dispatch(deleteScene({ universeId, storyboardId, sceneId }));
      dispatch(fetchScenes({ universeId, storyboardId }));
    }
  };

  const handleDialogClose = () => {
    setDialogState({
      open: false,
      mode: 'create',
      title: '',
      content: {},
    });
  };

  const handleDialogSave = async () => {
    const { mode, sceneId, title, content } = dialogState;

    if (mode === 'create') {
      await dispatch(
        createScene({
          universeId,
          storyboardId,
          sceneData: {
            title,
            sequence: scenes.length,
            content,
          },
        })
      );
    } else {
      await dispatch(
        updateScene({
          universeId,
          storyboardId,
          sceneId: sceneId!,
          sceneData: {
            title,
            content,
          },
        })
      );
    }

    handleDialogClose();
    dispatch(fetchScenes({ universeId, storyboardId }));
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const sceneIds = Array.from(scenes).map((scene: any) => scene.id);
    const [removed] = sceneIds.splice(result.source.index, 1);
    sceneIds.splice(result.destination.index, 0, removed);

    await dispatch(
      reorderScenes({
        universeId,
        storyboardId,
        sceneIds,
      })
    );
  };

  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Scenes</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateScene}
        >
          Add Scene
        </Button>
      </Box>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="scenes">
          {(provided) => (
            <List {...provided.droppableProps} ref={provided.innerRef}>
              {scenes.map((scene: any, index: number) => (
                <Draggable key={scene.id} draggableId={String(scene.id)} index={index}>
                  {(provided) => (
                    <Card
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      sx={{ mb: 2 }}
                    >
                      <CardContent>
                        <ListItem disablePadding>
                          <ListItemText
                            primary={scene.title}
                            secondary={`Scene ${index + 1}`}
                          />
                          <ListItemSecondaryAction>
                            <IconButton
                              edge="end"
                              aria-label="edit"
                              onClick={() => handleEditScene(scene)}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              edge="end"
                              aria-label="delete"
                              onClick={() => handleDeleteScene(scene.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      </CardContent>
                    </Card>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </List>
          )}
        </Droppable>
      </DragDropContext>

      <Dialog open={dialogState.open} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogState.mode === 'create' ? 'Create Scene' : 'Edit Scene'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            value={dialogState.title}
            onChange={(e) =>
              setDialogState((prev) => ({ ...prev, title: e.target.value }))
            }
          />
          <TextField
            margin="dense"
            label="Content"
            fullWidth
            multiline
            rows={4}
            value={JSON.stringify(dialogState.content, null, 2)}
            onChange={(e) => {
              try {
                const content = JSON.parse(e.target.value);
                setDialogState((prev) => ({ ...prev, content }));
              } catch (error) {
                // Invalid JSON, ignore
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleDialogSave} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
