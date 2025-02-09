import {
  createPhysicsObject,
  deletePhysicsObject,
  fetchPhysicsObject,
  fetchPhysicsObjects,
  selectCurrentObject,
  selectIsSimulating,
  selectObjects,
  selectPhysicsError,
  selectPhysicsLoading,
  selectTimeStep,
  setTimeStep,
  startSimulation,
  stopSimulation,
  updatePhysicsObject,
} from '@/store/slices/physicsSlice';

import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

export const usePhysics = projectId => {
  const dispatch = useDispatch();
  const objects = useSelector(selectObjects);
  const currentObject = useSelector(selectCurrentObject);
  const loading = useSelector(selectPhysicsLoading);
  const error = useSelector(selectPhysicsError);
  const isSimulating = useSelector(selectIsSimulating);
  const timeStep = useSelector(selectTimeStep);

  const fetchObjects = useCallback(async () => {
    try {
      await dispatch(fetchPhysicsObjects(projectId)).unwrap();
      return true;
    } catch (error) {
      return false;
    }
  }, [dispatch, projectId]);

  const fetchObject = useCallback(
    async objectId => {
      try {
        await dispatch(fetchPhysicsObject({ projectId, objectId })).unwrap();
        return true;
      } catch (error) {
        return false;
      }
    },
    [dispatch, projectId]
  );

  const createObject = useCallback(
    async data => {
      try {
        const result = await dispatch(createPhysicsObject({ projectId, data })).unwrap();
        return result;
      } catch (error) {
        return null;
      }
    },
    [dispatch, projectId]
  );

  const updateObject = useCallback(
    async (objectId, data) => {
      try {
        await dispatch(updatePhysicsObject({ projectId, objectId, data })).unwrap();
        return true;
      } catch (error) {
        return false;
      }
    },
    [dispatch, projectId]
  );

  const deleteObject = useCallback(
    async objectId => {
      try {
        await dispatch(deletePhysicsObject({ projectId, objectId })).unwrap();
        return true;
      } catch (error) {
        return false;
      }
    },
    [dispatch, projectId]
  );

  const handleSetTimeStep = useCallback(
    step => {
      dispatch(setTimeStep(step));
    },
    [dispatch]
  );

  const handleStartSimulation = useCallback(() => {
    dispatch(startSimulation());
  }, [dispatch]);

  const handleStopSimulation = useCallback(() => {
    dispatch(stopSimulation());
  }, [dispatch]);

  return {
    objects,
    currentObject,
    loading,
    error,
    isSimulating,
    timeStep,
    fetchObjects,
    fetchObject,
    createObject,
    updateObject,
    deleteObject,
    setTimeStep: handleSetTimeStep,
    startSimulation: handleStartSimulation,
    stopSimulation: handleStopSimulation,
  };
};
