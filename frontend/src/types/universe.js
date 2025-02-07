export interface Universe {
  id: number;
  name: string;
  description: string;
  isPublic: boolean;
  physicsParams: {
    gravity: [number, number, number];
    friction: number;
    elasticity: number;
    airResistance: number;
    timeDilation: number;
  };
  harmonyParams: {
    baseFrequency: number;
    scale: 'major' | 'minor' | 'pentatonic' | 'chromatic';
    tempo: number;
    volume: number;
    chordProgression: string[];
    energyLevel: number;
  };
  storyPoints: Array<{
    id: number;
    content: string;
    timestamp: string;
    harmonyTie?: {
      frequency?: number;
      tempo?: number;
      scale?: string;
    };
  }>;
  projectId: number;
  createdAt: string;
  updatedAt: string;
}

export interface UniverseFormData {
  name: string;
  description: string;
  isPublic: boolean;
  physicsParams?: Partial<Universe['physicsParams']>;
  harmonyParams?: Partial<Universe['harmonyParams']>;
}

export 

export interface StoryPoint {
  id: number;
  content: string;
  timestamp: string;
  harmonyTie?: {
    frequency?: number;
    tempo?: number;
    scale?: string;
  };
  universeId: number;
  createdAt: string;
  updatedAt: string;
}

export interface UniverseExport {
  id: number;
  name: string;
  description: string;
  physics: Universe['physicsParams'];
  harmony: Universe['harmonyParams'];
  story: StoryPoint[];
  metadata: {
    createdAt: string;
    updatedAt: string;
    exportedAt: string;
    version: string;
  };
}
