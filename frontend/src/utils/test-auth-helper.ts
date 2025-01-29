import { User } from '../types';

export const mockUser: User = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const mockAuthState = {
  user: mockUser,
  token: 'mock-jwt-token',
  isAuthenticated: true,
  isLoading: false,
  error: null,
};

export const mockUnauthenticatedState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export function getAuthPreloadedState(isAuthenticated = true) {
  return {
    auth: isAuthenticated ? mockAuthState : mockUnauthenticatedState,
  };
}

