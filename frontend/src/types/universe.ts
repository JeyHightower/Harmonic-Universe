export interface Universe {
  id: number;
  user_id: number;
  title: string;
  description: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface UniverseState {
  universes: Universe[];
  currentUniverse: Universe | null;
  isLoading: boolean;
  error: string | null;
}

export interface UniverseFormData {
  title: string;
  description: string;
  is_public: boolean;
}

export interface UniverseCollaborator {
  id: number;
  universe_id: number;
  user_id: number;
  role: 'viewer' | 'editor' | 'admin';
  created_at: string;
  updated_at: string;
}
