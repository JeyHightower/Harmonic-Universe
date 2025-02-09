export interface PhysicsParameterValue {
  value: number;
  unit: string;
  min: number;
  max: number;
  enabled: boolean;
  description: string;
}

export interface PhysicsParams {
  gravity: number;      // range: 0-100
  air_resistance: number; // range: 0-1
  elasticity: number;   // range: 0-1
  friction: number;     // range: 0-1
}

export interface HarmonyParameterValue {
  value: number;
  unit: string;
  min: number;
  max: number;
  enabled: boolean;
  description: string;
}

export interface HarmonyParams {
  resonance: number;    // range: 0-10
  dissonance: number;   // range: 0-1
  harmony_scale: number; // range: 0.1-10
  balance: number;      // range: 0-1
}

export interface Universe {
  id: number;
  name: string;
  description: string;
  is_public: boolean;
  physics_params: PhysicsParams;
  harmony_params: HarmonyParams;
  story_points: StoryPoint[];
  created_at: string;
  updated_at: string;
  user_id: number;
}

export interface UniverseFormData {
  name: string;
  description: string;
  is_public: boolean;
}

export interface StoryPoint {
  title: string;
  description: string;
  timestamp: string;
  parameters: Record<string, number>;
}

export interface UniverseExport {
  id: number;
  name: string;
  description: string;
  physics_params: PhysicsParams;
  harmony_params: HarmonyParams;
  story_points: StoryPoint[];
  metadata: {
    created_at: string;
    updated_at: string;
    exported_at: string;
    version: string;
  };
}

export interface UniverseCreate {
  name: string;
  description: string;
  is_public: boolean;
  physics_params: PhysicsParams;
  harmony_params: HarmonyParams;
}
