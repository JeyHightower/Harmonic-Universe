import { User } from './user';

export interface Universe {
  id: number;
  name: string;
  description: string;
  is_public: boolean;
  allow_guests: boolean;
  creator_id: number;
  created_at: string;
  updated_at: string;
  image?: string;
  creator?: User;
  parameters_count: number;
  collaborators_count: number;
  comments_count: number;
  favorites_count: number;
  is_favorited?: boolean;
}

export interface UniverseParameter {
  id: number;
  universe_id: number;
  name: string;
  value: number;
  unit: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface UniverseCollaborator {
  id: number;
  universe_id: number;
  user_id: number;
  role: 'viewer' | 'editor' | 'admin';
  user?: User;
  created_at: string;
  updated_at: string;
}

export interface UniverseComment {
  id: number;
  universe_id: number;
  user_id: number;
  content: string;
  user?: User;
  created_at: string;
  updated_at: string;
}

export interface UniverseFavorite {
  id: number;
  universe_id: number;
  user_id: number;
  user?: User;
  created_at: string;
}
