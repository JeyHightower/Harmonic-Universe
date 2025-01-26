export interface User {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  is_admin: boolean;
  avatar?: string;
  created_at: string;
  updated_at: string;
  universes_count: number;
  collaborations_count: number;
  comments_count: number;
  favorites_count: number;
}

export interface UserProfile extends User {
  bio?: string;
  location?: string;
  website?: string;
  social_links?: {
    twitter?: string;
    github?: string;
    linkedin?: string;
  };
}

export interface UserSettings {
  id: number;
  user_id: number;
  email_notifications: boolean;
  theme_preference: "light" | "dark" | "system";
  language: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}
