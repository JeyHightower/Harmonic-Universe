import axiosInstance from './api';

export const physicsService = {
  // Scene Management
  getScenes: async () => {
    const response = await axiosInstance.get('/physics/scenes');
    return response.data;
  },

  getScene: async (id) => {
    const response = await axiosInstance.get(`/physics/scenes/${id}`);
    return response.data;
  },

  createScene: async (scene) => {
    const response = await axiosInstance.post('/physics/scenes', scene);
    return response.data;
  },

  updateScene: async (id, updates) => {
    const response = await axiosInstance.patch(`/physics/scenes/${id}`, updates);
    return response.data;
  },

  deleteScene: async (id) => {
    await axiosInstance.delete(`/physics/scenes/${id}`);
  },

  // Object Management
  getObjects: async (sceneId) => {
    const response = await axiosInstance.get(`/physics/scenes/${sceneId}/objects`);
    return response.data;
  },

  createObject: async (sceneId, object) => {
    const response = await axiosInstance.post(`/physics/scenes/${sceneId}/objects`, object);
    return response.data;
  },

  updateObject: async (sceneId, objectId, updates) => {
    const response = await axiosInstance.patch(
      `/physics/scenes/${sceneId}/objects/${objectId}`,
      updates
    );
    return response.data;
  },

  deleteObject: async (sceneId, objectId) => {
    await axiosInstance.delete(`/physics/scenes/${sceneId}/objects/${objectId}`);
  },

  // Simulation Control
  startSimulation: async (sceneId) => {
    await axiosInstance.post(`/physics/scenes/${sceneId}/start`);
  },

  stopSimulation: async (sceneId) => {
    await axiosInstance.post(`/physics/scenes/${sceneId}/stop`);
  },

  resetSimulation: async (sceneId) => {
    await axiosInstance.post(`/physics/scenes/${sceneId}/reset`);
  },

  // Simulation Parameters
  updateParameters: async (sceneId, parameters) => {
    await axiosInstance.patch(`/physics/scenes/${sceneId}/parameters`, parameters);
  },
};
