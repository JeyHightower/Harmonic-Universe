import {
    Box,
    Breadcrumbs,
    Container,
    Link,
    Paper,
    Typography,
} from '@mui/material';
import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SceneEditor } from '../components/SceneEditor/SceneEditor';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import {
    fetchSceneById,
    selectCurrentScene,
    selectSceneError,
    selectSceneLoading,
} from '../store/slices/sceneSlice';
import { selectCurrentStoryboard } from '../store/slices/storyboardSlice';

export const ScenePage: React.FC = () => {
  const { universeId, storyboardId, sceneId } = useParams<{
    universeId: string;
    storyboardId: string;
    sceneId: string;
  }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const scene = useAppSelector(selectCurrentScene);
  const storyboard = useAppSelector(selectCurrentStoryboard);
  const isLoading = useAppSelector(selectSceneLoading);
  const error = useAppSelector(selectSceneError);

  useEffect(() => {
    if (universeId && storyboardId && sceneId) {
      dispatch(
        fetchSceneById({
          universeId: parseInt(universeId),
          storyboardId: parseInt(storyboardId),
          sceneId: parseInt(sceneId),
        })
      );
    }
  }, [dispatch, universeId, storyboardId, sceneId]);

  if (isLoading) {
    return (
      <Container maxWidth="lg">
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  if (!scene) {
    return (
      <Container maxWidth="lg">
        <Typography>Scene not found</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box my={4}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link
            color="inherit"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate('/universes');
            }}
          >
            Universes
          </Link>
          <Link
            color="inherit"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate(`/universes/${universeId}`);
            }}
          >
            Universe Details
          </Link>
          <Link
            color="inherit"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate(`/universes/${universeId}/storyboards/${storyboardId}`);
            }}
          >
            {storyboard?.title || 'Storyboard'}
          </Link>
          <Typography color="textPrimary">{scene.title}</Typography>
        </Breadcrumbs>

        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            {scene.title}
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            Scene {scene.sequence + 1}
          </Typography>
          <Typography variant="body1" paragraph>
            Content:
          </Typography>
          <Paper
            sx={{
              p: 2,
              backgroundColor: 'grey.100',
              maxHeight: '200px',
              overflow: 'auto',
            }}
          >
            <pre style={{ margin: 0 }}>
              {JSON.stringify(scene.content, null, 2)}
            </pre>
          </Paper>
        </Paper>

        <SceneEditor
          universeId={parseInt(universeId!)}
          storyboardId={parseInt(storyboardId!)}
          sceneId={parseInt(sceneId!)}
        />
      </Box>
    </Container>
  );
};

