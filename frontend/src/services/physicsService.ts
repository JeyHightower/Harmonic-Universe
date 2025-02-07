import { PhysicsObject, PhysicsScene } from '@/types';
import axiosInstance from './api';

export const physicsService = {
  // Scene Management
  getScenes: async (): Promise<PhysicsScene[]> => {
    const response = await axiosInstance.get('/physics/scenes');
    return response.data;
  },

  getScene: async (id: number): Promise<PhysicsScene> => {
    const response = await axiosInstance.get(`/physics/scenes/${id}`);
    return response.data;
  },

  createScene: async (scene: Omit<PhysicsScene, 'id'>): Promise<PhysicsScene> => {
    const response = await axiosInstance.post('/physics/scenes', scene);
    return response.data;
  },

  updateScene: async (id: number, updates: Partial<PhysicsScene>): Promise<PhysicsScene> => {
    const response = await axiosInstance.patch(`/physics/scenes/${id}`, updates);
    return response.data;
  },

  deleteScene: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/physics/scenes/${id}`);
  },

  // Object Management
  getObjects: async (sceneId: number): Promise<PhysicsObject[]> => {
    const response = await axiosInstance.get(`/physics/scenes/${sceneId}/objects`);
    return response.data;
  },

  createObject: async (
    sceneId: number,
    object: Omit<PhysicsObject, 'id'>
  ): Promise<PhysicsObject> => {
    const response = await axiosInstance.post(`/physics/scenes/${sceneId}/objects`, object);
    return response.data;
  },

  updateObject: async (
    sceneId: number,
    objectId: number,
    updates: Partial<PhysicsObject>
  ): Promise<PhysicsObject> => {
    const response = await axiosInstance.patch(
      `/physics/scenes/${sceneId}/objects/${objectId}`,
      updates
    );
    return response.data;
  },

  deleteObject: async (sceneId: number, objectId: number): Promise<void> => {
    await axiosInstance.delete(`/physics/scenes/${sceneId}/objects/${objectId}`);
  },

  // Simulation Control
  startSimulation: async (sceneId: number): Promise<void> => {
    await axiosInstance.post(`/physics/scenes/${sceneId}/start`);
  },

  stopSimulation: async (sceneId: number): Promise<void> => {
    await axiosInstance.post(`/physics/scenes/${sceneId}/stop`);
  },

  resetSimulation: async (sceneId: number): Promise<void> => {
    await axiosInstance.post(`/physics/scenes/${sceneId}/reset`);
  },

  // Simulation Parameters
  updateParameters: async (sceneId: number, parameters: any): Promise<void> => {
    await axiosInstance.patch(`/physics/scenes/${sceneId}/parameters`, parameters);
  },
};
