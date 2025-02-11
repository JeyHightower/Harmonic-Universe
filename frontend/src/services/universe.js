import axios from 'axios';

const API_URL = '/api/universes';

export const universeService = {
  async getAll() {
    const token = localStorage.getItem('token');
    const response = await axios.get(API_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async getById(id) {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async create(universeData) {
    const token = localStorage.getItem('token');
    const response = await axios.post(API_URL, universeData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async update(id, universeData) {
    const token = localStorage.getItem('token');
    const response = await axios.put(`${API_URL}/${id}`, universeData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async delete(id) {
    const token = localStorage.getItem('token');
    await axios.delete(`${API_URL}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async simulate(id, simulationParams) {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/${id}/simulate`,
      simulationParams,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  async updatePhysics(id, physicsParams) {
    const token = localStorage.getItem('token');
    const response = await axios.put(
      `${API_URL}/${id}/physics`,
      physicsParams,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  async updateAudio(id, audioParams) {
    const token = localStorage.getItem('token');
    const response = await axios.put(`${API_URL}/${id}/audio`, audioParams, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async updateVisualization(id, visualParams) {
    const token = localStorage.getItem('token');
    const response = await axios.put(
      `${API_URL}/${id}/visualization`,
      visualParams,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },
};
