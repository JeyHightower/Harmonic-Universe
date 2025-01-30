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
    Grid,
    IconButton,
    List,
    ListItem,
    ListItemSecondaryAction,
    ListItemText,
    Tab,
    Tabs,
    TextField,
    Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import {
    createAudioTrack,
    createVisualEffect,
    deleteAudioTrack,
    deleteVisualEffect,
    fetchAudioTracks,
    fetchVisualEffects,
    selectAudioTracks,
    selectMediaEffectError,
    selectMediaEffectLoading,
    selectVisualEffects,
    updateAudioTrack,
    updateVisualEffect,
} from '../../store/slices/mediaEffectSlice';
import PhysicsPanel from '../Scene/PhysicsPanel';

interface SceneEditorProps {
  universeId: number;
  storyboardId: number;
  sceneId: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`media-tabpanel-${index}`}
      aria-labelledby={`media-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface EffectDialogState {
  open: boolean;
  mode: 'create' | 'edit';
  type: 'visual' | 'audio';
  effectId?: number;
  effectType: string;
  parameters: Record<string, any>;
  startTime: number;
  duration: number;
  volume?: number;
}

export const SceneEditor: React.FC<SceneEditorProps> = ({
  universeId,
  storyboardId,
  sceneId,
}) => {
  const dispatch = useAppDispatch();
  const visualEffects = useAppSelector(selectVisualEffects);
  const audioTracks = useAppSelector(selectAudioTracks);
  const isLoading = useAppSelector(selectMediaEffectLoading);
  const error = useAppSelector(selectMediaEffectError);

  const [tabValue, setTabValue] = useState(0);
  const [dialogState, setDialogState] = useState<EffectDialogState>({
    open: false,
    mode: 'create',
    type: 'visual',
    effectType: '',
    parameters: {},
    startTime: 0,
    duration: 5,
  });

  useEffect(() => {
    dispatch(fetchVisualEffects({ universeId, storyboardId, sceneId }));
    dispatch(fetchAudioTracks({ universeId, storyboardId, sceneId }));
  }, [dispatch, universeId, storyboardId, sceneId]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCreateEffect = (type: 'visual' | 'audio') => {
    setDialogState({
      open: true,
      mode: 'create',
      type,
      effectType: '',
      parameters: {},
      startTime: 0,
      duration: 5,
      ...(type === 'audio' && { volume: 1.0 }),
    });
  };

  const handleEditEffect = (effect: any, type: 'visual' | 'audio') => {
    setDialogState({
      open: true,
      mode: 'edit',
      type,
      effectId: effect.id,
      effectType: type === 'visual' ? effect.effect_type : effect.track_type,
      parameters: effect.parameters,
      startTime: effect.start_time,
      duration: effect.duration,
      ...(type === 'audio' && { volume: effect.volume }),
    });
  };

  const handleDeleteEffect = async (effectId: number, type: 'visual' | 'audio') => {
    if (window.confirm('Are you sure you want to delete this effect?')) {
      if (type === 'visual') {
        await dispatch(
          deleteVisualEffect({ universeId, storyboardId, sceneId, effectId })
        );
        dispatch(fetchVisualEffects({ universeId, storyboardId, sceneId }));
      } else {
        await dispatch(
          deleteAudioTrack({ universeId, storyboardId, sceneId, trackId: effectId })
        );
        dispatch(fetchAudioTracks({ universeId, storyboardId, sceneId }));
      }
    }
  };

  const handleDialogClose = () => {
    setDialogState({
      open: false,
      mode: 'create',
      type: 'visual',
      effectType: '',
      parameters: {},
      startTime: 0,
      duration: 5,
    });
  };

  const handleDialogSave = async () => {
    const {
      mode,
      type,
      effectId,
      effectType,
      parameters,
      startTime,
      duration,
      volume,
    } = dialogState;

    if (type === 'visual') {
      const effectData = {
        effect_type: effectType,
        parameters,
        start_time: startTime,
        duration,
      };

      if (mode === 'create') {
        await dispatch(
          createVisualEffect({
            universeId,
            storyboardId,
            sceneId,
            effectData,
          })
        );
      } else {
        await dispatch(
          updateVisualEffect({
            universeId,
            storyboardId,
            sceneId,
            effectId: effectId!,
            effectData,
          })
        );
      }
      dispatch(fetchVisualEffects({ universeId, storyboardId, sceneId }));
    } else {
      const trackData = {
        track_type: effectType,
        parameters,
        start_time: startTime,
        duration,
        volume,
      };

      if (mode === 'create') {
        await dispatch(
          createAudioTrack({
            universeId,
            storyboardId,
            sceneId,
            trackData,
          })
        );
      } else {
        await dispatch(
          updateAudioTrack({
            universeId,
            storyboardId,
            sceneId,
            trackId: effectId!,
            trackData,
          })
        );
      }
      dispatch(fetchAudioTracks({ universeId, storyboardId, sceneId }));
    }

    handleDialogClose();
  };

  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="General" value="general" />
          <Tab label="Visual Effects" value="visual" />
          <Tab label="Audio Tracks" value="audio" />
          <Tab label="Physics" value="physics" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index="general">
        {/* General tab content */}
      </TabPanel>

      <TabPanel value={tabValue} index="visual">
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Visual Effects</Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleCreateEffect('visual')}
          >
            Add Effect
          </Button>
        </Box>

        <List>
          {visualEffects.map((effect: any) => (
            <Card key={effect.id} sx={{ mb: 2 }}>
              <CardContent>
                <ListItem disablePadding>
                  <ListItemText
                    primary={effect.effect_type}
                    secondary={`${effect.start_time}s - ${
                      effect.start_time + effect.duration
                    }s`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="edit"
                      onClick={() => handleEditEffect(effect, 'visual')}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleDeleteEffect(effect.id, 'visual')}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              </CardContent>
            </Card>
          ))}
        </List>
      </TabPanel>

      <TabPanel value={tabValue} index="audio">
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Audio Tracks</Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleCreateEffect('audio')}
          >
            Add Track
          </Button>
        </Box>

        <List>
          {audioTracks.map((track: any) => (
            <Card key={track.id} sx={{ mb: 2 }}>
              <CardContent>
                <ListItem disablePadding>
                  <ListItemText
                    primary={track.track_type}
                    secondary={`${track.start_time}s - ${
                      track.start_time + track.duration
                    }s (Volume: ${track.volume})`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="edit"
                      onClick={() => handleEditEffect(track, 'audio')}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleDeleteEffect(track.id, 'audio')}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              </CardContent>
            </Card>
          ))}
        </List>
      </TabPanel>

      <TabPanel value={tabValue} index="physics">
        <PhysicsPanel sceneId={sceneId} />
      </TabPanel>

      <Dialog open={dialogState.open} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogState.mode === 'create' ? 'Create' : 'Edit'}{' '}
          {dialogState.type === 'visual' ? 'Visual Effect' : 'Audio Track'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                select
                label={dialogState.type === 'visual' ? 'Effect Type' : 'Track Type'}
                fullWidth
                value={dialogState.effectType}
                onChange={(e) =>
                  setDialogState((prev) => ({ ...prev, effectType: e.target.value }))
                }
                SelectProps={{
                  native: true,
                }}
              >
                <option value="">Select a type</option>
                {dialogState.type === 'visual' ? (
                  <>
                    <option value="particle">Particle</option>
                    <option value="shader">Shader</option>
                    <option value="post_process">Post Process</option>
                    <option value="environment">Environment</option>
                  </>
                ) : (
                  <>
                    <option value="procedural">Procedural</option>
                    <option value="ambient">Ambient</option>
                    <option value="effect">Effect</option>
                    <option value="music">Music</option>
                  </>
                )}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Parameters"
                fullWidth
                multiline
                rows={4}
                value={JSON.stringify(dialogState.parameters, null, 2)}
                onChange={(e) => {
                  try {
                    const parameters = JSON.parse(e.target.value);
                    setDialogState((prev) => ({ ...prev, parameters }));
                  } catch (error) {
                    // Invalid JSON, ignore
                  }
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Start Time (seconds)"
                type="number"
                fullWidth
                value={dialogState.startTime}
                onChange={(e) =>
                  setDialogState((prev) => ({
                    ...prev,
                    startTime: parseFloat(e.target.value),
                  }))
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Duration (seconds)"
                type="number"
                fullWidth
                value={dialogState.duration}
                onChange={(e) =>
                  setDialogState((prev) => ({
                    ...prev,
                    duration: parseFloat(e.target.value),
                  }))
                }
              />
            </Grid>
            {dialogState.type === 'audio' && (
              <Grid item xs={12}>
                <TextField
                  label="Volume (0-1)"
                  type="number"
                  fullWidth
                  value={dialogState.volume}
                  onChange={(e) =>
                    setDialogState((prev) => ({
                      ...prev,
                      volume: parseFloat(e.target.value),
                    }))
                  }
                  inputProps={{ min: 0, max: 1, step: 0.1 }}
                />
              </Grid>
            )}
          </Grid>
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
