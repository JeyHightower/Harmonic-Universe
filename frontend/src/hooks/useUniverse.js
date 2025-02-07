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
    updatePhysics,
    updateUniverse,
} from '@/store/slices/universeSlice';
import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { io } from 'socket.io-client';

/**
 * @typedef {Object} Universe
 * @property {number} id
 * @property {string} name
 * @property {string} description
 * @property {boolean} isPublic
 * @property {Object} physicsParams
 * @property {[number, number, number]} physicsParams.gravity
 * @property {[number, number, number]} physicsParams.friction
 * @property {[number, number, number]} physicsParams.elasticity
 * @property {[number, number, number]} physicsParams.airResistance
 * @property {number} physicsParams.timeDilation
 * @property {number} physicsParams.particleMass
 * @property {number} physicsParams.energyDissipation
 * @property {Object} harmonyParams
 * @property {number} harmonyParams.baseFrequency
 * @property {number[]} harmonyParams.harmonicSeries
 * @property {number} harmonyParams.resonance
 * @property {number} harmonyParams.damping
 * @property {number} harmonyParams.interference
 * @property {string} harmonyParams.scale
 * @property {number} harmonyParams.tempo
 * @property {string[]} harmonyParams.rhythmPattern
 * @property {Object} harmonyParams.aiGenerationParams
 * @property {string} harmonyParams.aiGenerationParams.style
 * @property {number} harmonyParams.aiGenerationParams.complexity
 * @property {string} harmonyParams.aiGenerationParams.mood
 * @property {number} harmonyParams.aiGenerationParams.intensity
 */

export const useUniverse = () => {
  const dispatch = useDispatch();
  const { showNotification } = useNotification();
  const universes = useSelector(selectUniverses);
  const currentUniverse = useSelector(selectCurrentUniverse);
  const error = useSelector(selectUniverseError);
  const loading = useSelector(selectUniverseLoading);

  // WebSocket connection
  let socket = null;

  const connectToUniverse = useCallback(
    (universeId) => {
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
    async (universeId) => {
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
    async (data) => {
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
    async (universeId, data) => {
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
    async (universeId) => {
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
    async (universeId, parameters) => {
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
    async (universeId, storyPoint) => {
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
    async (universeId, format) => {
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
