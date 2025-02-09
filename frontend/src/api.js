const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,  // Important for cookies
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add interceptor to include auth token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
