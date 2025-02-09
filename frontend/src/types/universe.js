export interface PhysicsParameterValue {
  value: number;
  unit?: string;
  min: number;
  max: number;
  enabled: boolean;
}

export interface PhysicsParams {
  gravity: PhysicsParameterValue;
  friction: PhysicsParameterValue;
  elasticity: PhysicsParameterValue;
  air_resistance: PhysicsParameterValue;
  time_step: PhysicsParameterValue;
  substeps: PhysicsParameterValue;
  [key: string]: PhysicsParameterValue;
}

export interface HarmonyParameterValue {
  value: number;
  min: number;
  max: number;
  enabled: boolean;
}

export interface HarmonyParams {
  resonance: HarmonyParameterValue;
  dissonance: HarmonyParameterValue;
  harmony_scale: HarmonyParameterValue;
  balance: HarmonyParameterValue;
  [key: string]: HarmonyParameterValue;
}

export interface Universe {
  id: number;
  name: string;
  description: string;
  is_public: boolean;
  physics_params: PhysicsParams;
  harmony_params: HarmonyParams;
  story_points: Array<{
    id: number;
    content: string;
    timestamp: string;
    harmony_tie?: {
      frequency?: number;
      tempo?: number;
      scale?: string;
    };
  }>;
  project_id: number;
  created_at: string;
  updated_at: string;
}

export interface UniverseFormData {
  name: string;
  description: string;
  is_public: boolean;
  physics_params?: Partial<PhysicsParams>;
  harmony_params?: Partial<HarmonyParams>;
}

export interface StoryPoint {
  id: number;
  content: string;
  timestamp: string;
  harmony_tie?: {
    frequency?: number;
    tempo?: number;
    scale?: string;
  };
  universe_id: number;
  created_at: string;
  updated_at: string;
}

export interface UniverseExport {
  id: number;
  name: string;
  description: string;
  physics: PhysicsParams;
  harmony: HarmonyParams;
  story: StoryPoint[];
  metadata: {
    created_at: string;
    updated_at: string;
    exported_at: string;
    version: string;
  };
}
