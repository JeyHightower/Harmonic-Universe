import api from './api';
import websocket from './websocket';

class AuthService {
    async register(userData) {
        const response = await api.post('/api/auth/register', userData);
        return response.data;
    }

    async login(credentials) {
        const response = await api.post('/api/auth/login', credentials);
        const { token, user } = response.data;

        localStorage.setItem('token', token);
        websocket.connect(token);

        return user;
    }

    logout() {
        localStorage.removeItem('token');
        websocket.disconnect();
        window.location.href = '/login';
    }

    async getCurrentUser() {
        const response = await api.get('/api/auth/me');
        return response.data;
    }

    isAuthenticated() {
        return !!localStorage.getItem('token');
    }
}

export default new AuthService();
