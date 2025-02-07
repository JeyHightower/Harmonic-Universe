export interface Visualization {
  id: number;
  name: string;
  title?: string;
  type: string;
  data_source: DataSource;
  description?: string;
  settings: VisualizationSettings;
  dataMappings?: DataMapping[];
  streamConfig?: StreamConfig;
  data?: any; // Runtime data for visualization
  createdAt: string;
  updatedAt: string;
}

export interface VisualizationSettings {
  width: number;
  height: number;
  backgroundColor: string;
  foregroundColor: string;
  showAxes?: boolean;
  showGrid?: boolean;
  showLabels?: boolean;
  customSettings?: Record<string, any>;
}

export interface DataMapping {
  sourceField: string;
  targetField: string;
  transformationType: 'direct' | 'scale' | 'map' | 'custom';
  transformationConfig?: {
    inputRange?: [number, number];
    outputRange?: [number, number];
    mappingFunction?: string;
    customConfig?: Record<string, any>;
  };
}

export interface StreamConfig {
  streamType: 'websocket' | 'midi' | 'audio' | 'custom';
  bufferSize: number;
  sampleRate: number;
  connectionSettings: {
    url?: string;
    protocol?: string;
    deviceId?: string;
    [key: string]: any;
  };
  processingPipeline: ProcessingStep[];
}

export interface ProcessingStep {
  type: string;
  config: Record<string, any>;
}

export interface VisualizationFormData {
  name: string;
  type: string;
  description?: string;
  settings: Partial;
  dataMappings?: Partial[];
  streamConfig?: Partial;
}

export interface VisualizationUpdateData {
  name?: string;
  type?: string;
  description?: string;
  settings?: Partial;
  dataMappings?: Partial[];
  streamConfig?: Partial;
}

export 

export 
