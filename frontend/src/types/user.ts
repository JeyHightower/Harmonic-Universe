export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: number;
  user_id: number;
  bio: string;
  avatar_url?: string;
  social_links: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  id: number;
  user_id: number;
  theme: 'light' | 'dark';
  notifications_enabled: boolean;
  email_notifications: boolean;
  preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UserState {
  profile: UserProfile | null;
  settings: UserSettings | null;
  isLoading: boolean;
  error: string | null;
}

export interface UserFormData {
  username?: string;
  email?: string;
  bio?: string;
  avatar_url?: string;
  social_links?: Record<string, string>;
  theme?: 'light' | 'dark';
  notifications_enabled?: boolean;
  email_notifications?: boolean;
  preferences?: Record<string, any>;
}
