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
import { StoryboardEditor } from '../components/StoryboardEditor/StoryboardEditor';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import {
    fetchStoryboardById,
    selectCurrentStoryboard,
    selectStoryboardError,
    selectStoryboardLoading,
} from '../store/slices/storyboardSlice';

export const StoryboardPage: React.FC = () => {
  const { universeId, storyboardId } = useParams<{
    universeId: string;
    storyboardId: string;
  }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const storyboard = useAppSelector(selectCurrentStoryboard);
  const isLoading = useAppSelector(selectStoryboardLoading);
  const error = useAppSelector(selectStoryboardError);

  useEffect(() => {
    if (universeId && storyboardId) {
      dispatch(
        fetchStoryboardById({
          universeId: parseInt(universeId),
          storyboardId: parseInt(storyboardId),
        })
      );
    }
  }, [dispatch, universeId, storyboardId]);

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

  if (!storyboard) {
    return (
      <Container maxWidth="lg">
        <Typography>Storyboard not found</Typography>
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
          <Typography color="textPrimary">{storyboard.title}</Typography>
        </Breadcrumbs>

        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            {storyboard.title}
          </Typography>
          {storyboard.description && (
            <Typography variant="body1" color="textSecondary" paragraph>
              {storyboard.description}
            </Typography>
          )}
        </Paper>

        <StoryboardEditor
          universeId={parseInt(universeId!)}
          storyboardId={parseInt(storyboardId!)}
        />
      </Box>
    </Container>
  );
};
