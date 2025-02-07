export interface User {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin';
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
    autoSave: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface PasswordReset {
  email: string;
  token: string;
  newPassword: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  notifications: boolean;
  autoSave: boolean;
  defaultProjectSettings: {
    isPublic: boolean;
    autosaveInterval: number;
  };
}
