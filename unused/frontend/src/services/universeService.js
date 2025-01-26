import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class UniverseService {
    async getUniverses() {
        return axios.get(`${API_URL}/universes`);
    }

    async getUniverse(id) {
        return axios.get(`${API_URL}/universes/${id}`);
    }

    async createUniverse(data) {
        return axios.post(`${API_URL}/universes`, data);
    }

    async updateUniverse(id, data) {
        return axios.put(`${API_URL}/universes/${id}`, data);
    }

    async deleteUniverse(id) {
        return axios.delete(`${API_URL}/universes/${id}`);
    }

    async updateParameters(id, type, parameters) {
        return axios.put(`${API_URL}/universes/${id}/parameters/${type}`, { parameters });
    }

    async exportUniverse(id, format = 'json') {
        return axios.get(`${API_URL}/universes/${id}/export`, {
            params: { format },
            responseType: format === 'json' ? 'json' : 'blob'
        });
    }

    async getFavorites() {
        return axios.get(`${API_URL}/universes/favorites`);
    }

    async toggleFavorite(id) {
        return axios.post(`${API_URL}/universes/${id}/favorite`);
    }

    async getCollaborators(id) {
        return axios.get(`${API_URL}/universes/${id}/collaborators`);
    }

    async addCollaborator(id, userId) {
        return axios.post(`${API_URL}/universes/${id}/collaborators`, { user_id: userId });
    }

    async removeCollaborator(id, userId) {
        return axios.delete(`${API_URL}/universes/${id}/collaborators/${userId}`);
    }

    async updateCollaboratorPermissions(id, userId, permissions) {
        return axios.put(`${API_URL}/universes/${id}/collaborators/${userId}`, { permissions });
    }
}

export const universeService = new UniverseService();
