import axios from 'axios';
import { useCallback } from 'react';
import { useAuth } from './useAuth';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const useApi = () => {
  const { getToken } = useAuth();

  const createAxiosInstance = useCallback(() => {
    const token = getToken();
    return axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  }, [getToken]);

  const handleRequest = useCallback(async (method, url, data = null, config = {}) => {
    try {
      const api = createAxiosInstance();
      const response = await api({
        method,
        url,
        data,
        ...config,
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        throw new Error(error.response.data.error || 'Server error');
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error('No response from server');
      } else {
        // Something happened in setting up the request that triggered an Error
        throw new Error('Request configuration error');
      }
    }
  }, [createAxiosInstance]);

  return {
    get: useCallback((url, config) => handleRequest('get', url, null, config), [handleRequest]),
    post: useCallback((url, data, config) => handleRequest('post', url, data, config), [handleRequest]),
    put: useCallback((url, data, config) => handleRequest('put', url, data, config), [handleRequest]),
    patch: useCallback((url, data, config) => handleRequest('patch', url, data, config), [handleRequest]),
    delete: useCallback((url, config) => handleRequest('delete', url, null, config), [handleRequest]),
  };
};

export default useApi;
