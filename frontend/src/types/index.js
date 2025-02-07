// Common Types
export 

// Audio Types
export interface AudioTrack {
  id: number;
  name: string;
  file_type: string;
  file_path: string;
  duration: number;
  volume: number;
  is_muted: boolean;
  is_solo: boolean;
  is_armed: boolean;
  midi_sequence_id?: number;
  effects: AudioEffect[];
  is_playing: boolean;
  pan: number;
}

export interface AudioEffect {
  id: string;
  type: string;
  name: string;
  enabled: boolean;
  parameters: AudioEffectParameter[];
}

export interface AudioEffectParameter {
  name: string;
  value: number;
  min: number;
  max: number;
  step: number;
}

// Physics Types
export interface PhysicsObject {
  id: number;
  name: string;
  type: string;
  position: Vector3D;
  rotation: Vector3D;
  scale: Vector3D;
  mass: number;
  isVisible: boolean;
  material: {
    color: string;
    metalness: number;
    roughness: number;
  };
  physics: {
    type: string;
    restitution: number;
    friction: number;
  };
  quaternion?: Vector3D;
  order?: number;
}

export interface PhysicsScene {
  id: number;
  name: string;
  description: string;
  objects: PhysicsObject[];
  settings: {
    gravity: Vector3D;
    solver: {
      iterations: number;
      tolerance: number;
    };
  };
  constraints: PhysicsConstraint[];
}

export interface PhysicsConstraint {
  id: number;
  type: string;
  objectA: number;
  objectB: number;
  params: {
    pivotA?: Vector3D;
    pivotB?: Vector3D;
    axisA?: Vector3D;
    axisB?: Vector3D;
    maxForce?: number;
    collideConnected?: boolean;
  };
}

// Visualization Types
export interface Visualization {
  id: number;
  name: string;
  description: string;
  visualization_type: string;
  data_source: string;
  settings: any;
  layout: {
    position: string;
    size: string;
  };
  style: {
    backgroundColor: string;
    [key: string]: any;
  };
  is_real_time: boolean;
  update_interval: number;
  data_mappings?: DataMapping[];
  stream_config?: StreamConfig;
  metrics?: {
    fps: number;
    dataPoints: number;
    peakAmplitude: number;
    [key: string]: any;
  };
}

export interface DataMapping {
  id: number;
  data_field: string;
  visual_property: string;
  mapping_type: string;
  range_min?: number;
  range_max?: number;
  scale_factor?: number;
  enabled: boolean;
}

export interface StreamConfig {
  stream_type: string;
  buffer_size: number;
  sample_rate: number;
  connection_settings: {
    [key: string]: any;
  };
  processing_pipeline: Array<{
    type: string;
    params: {
      [key: string]: any;
    };
  }>;
}

// AI Types
export interface AIModel {
  id: number;
  name: string;
  description: string;
  model_type: string;
  architecture: string;
  version: string;
  status: string;
  is_public: boolean;
  parameters: {
    [key: string]: any;
  };
  metrics: {
    [key: string]: any;
  };
  deployment?: {
    status: string;
    endpoint: string | null;
    metrics?: {
      [key: string]: any;
    };
  };
  monitoring?: {
    latest_metrics: {
      [key: string]: any;
    };
    metrics_history: Array<{
      timestamp: number;
      [key: string]: any;
    }>;
  };
  serving?: {
    latest_metrics: {
      [key: string]: any;
    };
    metrics_history: Array<{
      timestamp: number;
      [key: string]: any;
    }>;
    config: {
      batch_size: number;
      timeout_ms: number;
      max_batch_latency_ms: number;
      cache_size: number;
      enable_optimization: boolean;
    };
  };
  experiments?: Array<{
    id: number;
    name: string;
    description: string;
    hyperparameters: {
      [key: string]: any;
    };
    metrics: {
      [key: string]: any;
    };
    status: string;
    start_time: number;
    end_time?: number;
    artifacts: Array<{
      type: string;
      path: string;
      metadata: any;
    }>;
    tags: string[];
  }>;
  pipelines?: Array<{
    id: number;
    name: string;
    description: string;
    stages: Array<{
      id: number;
      name: string;
      type: string;
      config: {
        [key: string]: any;
      };
      inputs: Array<{
        source: string;
        field: string;
      }>;
      outputs: Array<{
        name: string;
        type: string;
      }>;
      status: string;
      metrics?: {
        [key: string]: any;
      };
    }>;
    status: string;
    created_at: number;
    updated_at: number;
    metrics?: {
      [key: string]: any;
    };
  }>;
  versions?: Array<{
    id: number;
    version: string;
    description: string;
    created_at: number;
    metrics: {
      [key: string]: any;
    };
    artifacts: Array<{
      type: string;
      path: string;
      metadata: any;
    }>;
    status: string;
  }>;
  datasets?: Array<{
    id: number;
    name: string;
    description: string;
    type: string;
    size: number;
    created_at: number;
    updated_at: number;
    metadata: {
      features: string[];
      target?: string;
      format: string;
      schema: {
        [key: string]: string;
      };
    };
    stats: {
      [key: string]: {
        mean?: number;
        std?: number;
        min?: number;
        max?: number;
        unique?: number;
        missing?: number;
      };
    };
  }>;
}

// Auth Types
export interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  preferences?: Record<string, any>;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export * from './audio';
export * from './project';
export * from './user';
export * from './visualization';
