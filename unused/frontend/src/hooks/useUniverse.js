import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { universeService } from '../services';
import {
    createUniverse,
    deleteUniverse,
    fetchUniverse,
    fetchUniverses,
    setSimulationStatus,
    updateParameters,
    updateUniverse
} from '../store/slices/universeSlice';

export const useUniverse = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const {
        universes,
        currentUniverse,
        loading,
        error,
        simulationStatus
    } = useSelector((state) => state.universe);

    const handleFetchUniverses = useCallback(async () => {
        try {
            await dispatch(fetchUniverses()).unwrap();
        } catch (error) {
            console.error('Failed to fetch universes:', error);
            throw error;
        }
    }, [dispatch]);

    const handleFetchUniverse = useCallback(async (id) => {
        try {
            await dispatch(fetchUniverse(id)).unwrap();
            universeService.joinUniverse(id);
        } catch (error) {
            console.error('Failed to fetch universe:', error);
            throw error;
        }
    }, [dispatch]);

    const handleCreateUniverse = useCallback(async (data) => {
        try {
            const universe = await dispatch(createUniverse(data)).unwrap();
            navigate(`/universe/${universe.id}`);
            return universe;
        } catch (error) {
            console.error('Failed to create universe:', error);
            throw error;
        }
    }, [dispatch, navigate]);

    const handleUpdateUniverse = useCallback(async (id, data) => {
        try {
            return await dispatch(updateUniverse({ id, data })).unwrap();
        } catch (error) {
            console.error('Failed to update universe:', error);
            throw error;
        }
    }, [dispatch]);

    const handleDeleteUniverse = useCallback(async (id) => {
        try {
            await dispatch(deleteUniverse(id)).unwrap();
            navigate('/dashboard');
        } catch (error) {
            console.error('Failed to delete universe:', error);
            throw error;
        }
    }, [dispatch, navigate]);

    const handleUpdateParameters = useCallback(async (id, type, parameters) => {
        try {
            return await dispatch(updateParameters({ id, type, parameters })).unwrap();
        } catch (error) {
            console.error('Failed to update parameters:', error);
            throw error;
        }
    }, [dispatch]);

    const handleStartSimulation = useCallback((id) => {
        universeService.startSimulation(id);
        dispatch(setSimulationStatus('running'));
    }, [dispatch]);

    const handleStopSimulation = useCallback((id) => {
        universeService.stopSimulation(id);
        dispatch(setSimulationStatus('stopped'));
    }, [dispatch]);

    const handleResetSimulation = useCallback((id) => {
        universeService.resetSimulation(id);
        dispatch(setSimulationStatus('stopped'));
    }, [dispatch]);

    const handleLeaveUniverse = useCallback((id) => {
        universeService.leaveUniverse(id);
    }, []);

    return {
        universes,
        currentUniverse,
        loading,
        error,
        simulationStatus,
        fetchUniverses: handleFetchUniverses,
        fetchUniverse: handleFetchUniverse,
        createUniverse: handleCreateUniverse,
        updateUniverse: handleUpdateUniverse,
        deleteUniverse: handleDeleteUniverse,
        updateParameters: handleUpdateParameters,
        startSimulation: handleStartSimulation,
        stopSimulation: handleStopSimulation,
        resetSimulation: handleResetSimulation,
        leaveUniverse: handleLeaveUniverse
    };
};
