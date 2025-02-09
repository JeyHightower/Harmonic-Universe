import {
  deleteTrack,
  fetchTracks,
  selectCurrentTime,
  selectCurrentTrack,
  selectDuration,
  selectError,
  selectIsPlaying,
  selectLoading,
  selectTracks,
  selectVolume,
  setCurrentTime,
  setCurrentTrack,
  setDuration,
  setIsPlaying,
  setVolume,
  updateTrack,
  updateTrackState,
  uploadAudio,
} from '@/store/slices/audioSlice';

import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

export const useAudio = projectId => {
  const dispatch = useDispatch();
  const tracks = useSelector(selectTracks);
  const currentTrack = useSelector(selectCurrentTrack);
  const isPlaying = useSelector(selectIsPlaying);
  const volume = useSelector(selectVolume);
  const duration = useSelector(selectDuration);
  const currentTime = useSelector(selectCurrentTime);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);

  const loadTracks = useCallback(async () => {
    await dispatch(fetchTracks(projectId));
  }, [dispatch, projectId]);

  const handleUploadAudio = useCallback(
    async formData => {
      await dispatch(uploadAudio({ projectId, formData }));
    },
    [dispatch, projectId]
  );

  const handleDeleteTrack = useCallback(
    async trackId => {
      await dispatch(deleteTrack({ projectId, trackId }));
    },
    [dispatch, projectId]
  );

  const handleUpdateTrack = useCallback(
    async (trackId, updates) => {
      await dispatch(updateTrack({ projectId, trackId, updates }));
    },
    [dispatch, projectId]
  );

  const handleSetCurrentTrack = useCallback(
    track => {
      dispatch(setCurrentTrack(track));
    },
    [dispatch]
  );

  const handleSetIsPlaying = useCallback(
    playing => {
      dispatch(setIsPlaying(playing));
    },
    [dispatch]
  );

  const handleSetVolume = useCallback(
    newVolume => {
      dispatch(setVolume(newVolume));
    },
    [dispatch]
  );

  const handleSetDuration = useCallback(
    newDuration => {
      dispatch(setDuration(newDuration));
    },
    [dispatch]
  );

  const handleSetCurrentTime = useCallback(
    time => {
      dispatch(setCurrentTime(time));
    },
    [dispatch]
  );

  const handleUpdateTrackState = useCallback(
    (trackId, updates) => {
      dispatch(updateTrackState({ trackId, updates }));
    },
    [dispatch]
  );

  return {
    tracks,
    currentTrack,
    isPlaying,
    volume,
    duration,
    currentTime,
    loading,
    error,
    loadTracks,
    uploadAudio: handleUploadAudio,
    deleteTrack: handleDeleteTrack,
    updateTrack: handleUpdateTrack,
    setCurrentTrack: handleSetCurrentTrack,
    setIsPlaying: handleSetIsPlaying,
    setVolume: handleSetVolume,
    setDuration: handleSetDuration,
    setCurrentTime: handleSetCurrentTime,
    updateTrackState: handleUpdateTrackState,
  };
};
