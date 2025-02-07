import { Project } from '@/types/project';
import api from './api';

export const projectService = {
  // Fetch all projects
  fetchProjects: async (): Promise<Project[]> => {
    const response = await api.get('/api/v1/projects');
    return response.data;
  },

  // Fetch a single project
  fetchProject: async (projectId: number): Promise<Project> => {
    const response = await api.get(`/api/v1/projects/${projectId}`);
    return response.data;
  },

  // Create a new project
  createProject: async (data: {
    title: string;
    description: string;
    isPublic: boolean;
  }): Promise<Project> => {
    const response = await api.post('/api/v1/projects', data);
    return response.data;
  },

  // Update a project
  updateProject: async (projectId: number, data: Partial<Project>): Promise<Project> => {
    const response = await api.put(`/api/v1/projects/${projectId}`, data);
    return response.data;
  },

  // Delete a project
  deleteProject: async (projectId: number): Promise<void> => {
    await api.delete(`/api/v1/projects/${projectId}`);
  },

  // Share a project
  shareProject: async (projectId: number, userId: number): Promise<void> => {
    await api.post(`/api/v1/projects/${projectId}/share`, { userId });
  },

  // Unshare a project
  unshareProject: async (projectId: number, userId: number): Promise<void> => {
    await api.delete(`/api/v1/projects/${projectId}/share/${userId}`);
  },

  // Get project collaborators
  getCollaborators: async (projectId: number): Promise<{ id: number; username: string }[]> => {
    const response = await api.get(`/api/v1/projects/${projectId}/collaborators`);
    return response.data;
  },

  // Export project
  exportProject: async (projectId: number, format: string): Promise<Blob> => {
    const response = await api.get(`/api/v1/projects/${projectId}/export?format=${format}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
