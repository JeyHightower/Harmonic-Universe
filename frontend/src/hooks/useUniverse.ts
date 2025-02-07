import { useNotification } from '@/components/common/Notification';
import {
  addStoryPoint,
  clearError,
  createUniverse,
  deleteUniverse,
  exportUniverse,
  fetchUniverse,
  fetchUniverses,
  selectCurrentUniverse,
  selectUniverseError,
  selectUniverseLoading,
  selectUniverses,
  Universe,
  updatePhysics,
  updateUniverse,
} from '@/store/slices/universeSlice';
import { AppDispatch } from '@/store/store';
import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { io, Socket } from 'socket.io-client';

export const useUniverse = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { showNotification } = useNotification();
  const universes = useSelector(selectUniverses);
  const currentUniverse = useSelector(selectCurrentUniverse);
  const error = useSelector(selectUniverseError);
  const loading = useSelector(selectUniverseLoading);

  // WebSocket connection
  let socket: Socket | null = null;

  const connectToUniverse = useCallback(
    (universeId: number) => {
      if (socket) {
        socket.disconnect();
      }

      socket = io(import.meta.env.VITE_API_URL, {
        query: {
          token: localStorage.getItem('token'),
        },
      });

      socket.on('connect', () => {
        socket?.emit('join_universe', { universe_id: universeId });
      });

      socket.on('universe_joined', data => {
        showNotification(data.message, 'success');
      });

      socket.on('physics_changed', data => {
        if (currentUniverse?.id === data.universe_id) {
          dispatch(
            updatePhysics({
              universeId: data.universe_id,
              parameters: data.parameters,
            })
          );
        }
      });

      socket.on('harmony_changed', data => {
        // Handle harmony updates
        console.log('Harmony updated:', data);
      });

      socket.on('story_changed', data => {
        if (currentUniverse?.id === data.universe_id) {
          dispatch(fetchUniverse(data.universe_id));
        }
      });

      socket.on('error', data => {
        showNotification(data.message, 'error');
      });

      return () => {
        if (socket) {
          socket.disconnect();
        }
      };
    },
    [dispatch, currentUniverse, showNotification]
  );

  const handleFetchUniverses = useCallback(async () => {
    try {
      await dispatch(fetchUniverses()).unwrap();
      return true;
    } catch (error) {
      return false;
    }
  }, [dispatch]);

  const handleFetchUniverse = useCallback(
    async (universeId: number) => {
      try {
        await dispatch(fetchUniverse(universeId)).unwrap();
        connectToUniverse(universeId);
        return true;
      } catch (error) {
        return false;
      }
    },
    [dispatch, connectToUniverse]
  );

  const handleCreateUniverse = useCallback(
    async (data: {
      name: string;
      description: string;
      isPublic: boolean;
      physicsParams?: Partial<Universe['physicsParams']>;
      harmonyParams?: Partial<Universe['harmonyParams']>;
    }) => {
      try {
        const universe = await dispatch(createUniverse(data)).unwrap();
        showNotification('Universe created successfully', 'success');
        return universe;
      } catch (error) {
        return null;
      }
    },
    [dispatch, showNotification]
  );

  const handleUpdateUniverse = useCallback(
    async (universeId: number, data: Partial<Universe>) => {
      try {
        await dispatch(updateUniverse({ universeId, data })).unwrap();
        showNotification('Universe updated successfully', 'success');
        return true;
      } catch (error) {
        return false;
      }
    },
    [dispatch, showNotification]
  );

  const handleDeleteUniverse = useCallback(
    async (universeId: number) => {
      try {
        await dispatch(deleteUniverse(universeId)).unwrap();
        showNotification('Universe deleted successfully', 'success');
        return true;
      } catch (error) {
        return false;
      }
    },
    [dispatch, showNotification]
  );

  const handleUpdatePhysics = useCallback(
    async (universeId: number, parameters: Partial<Universe['physicsParams']>) => {
      try {
        await dispatch(updatePhysics({ universeId, parameters })).unwrap();
        return true;
      } catch (error) {
        return false;
      }
    },
    [dispatch]
  );

  const handleAddStoryPoint = useCallback(
    async (
      universeId: number,
      storyPoint: Omit<Universe['storyPoints'][0], 'id' | 'timestamp'>
    ) => {
      try {
        await dispatch(addStoryPoint({ universeId, storyPoint })).unwrap();
        showNotification('Story point added successfully', 'success');
        return true;
      } catch (error) {
        return false;
      }
    },
    [dispatch, showNotification]
  );

  const handleExportUniverse = useCallback(
    async (universeId: number, format: 'json' | 'audio') => {
      try {
        const result = await dispatch(exportUniverse({ universeId, format })).unwrap();
        showNotification('Universe exported successfully', 'success');
        return result;
      } catch (error) {
        return null;
      }
    },
    [dispatch, showNotification]
  );

  const handleClearError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  return {
    universes,
    currentUniverse,
    error,
    loading,
    fetchUniverses: handleFetchUniverses,
    fetchUniverse: handleFetchUniverse,
    createUniverse: handleCreateUniverse,
    updateUniverse: handleUpdateUniverse,
    deleteUniverse: handleDeleteUniverse,
    updatePhysics: handleUpdatePhysics,
    addStoryPoint: handleAddStoryPoint,
    exportUniverse: handleExportUniverse,
    clearError: handleClearError,
  };
};
