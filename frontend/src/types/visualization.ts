export interface Visualization {
  id: number;
  projectId: number;
  name: string;
  type: 'waveform' | 'spectrogram' | '3d' | 'realtime';
  dataSource: string;
  settings: {
    backgroundColor: string;
    dimensions: {
      width: number;
      height: number;
      depth?: number;
    };
    camera?: {
      position: [number, number, number];
      target: [number, number, number];
      fov: number;
    };
  };
  dataMappings: {
    id: number;
    dataField: string;
    visualProperty: string;
    mappingType: string;
    rangeMin?: number;
    rangeMax?: number;
    scaleFactor?: number;
    enabled: boolean;
  }[];
  streamConfig?: {
    streamType: string;
    bufferSize: number;
    sampleRate: number;
    connectionSettings: Record<string, any>;
    processingPipeline: {
      id: number;
      type: string;
      settings: Record<string, any>;
    }[];
  };
  layout: {
    position: string;
    size: string;
  };
  style: {
    backgroundColor: string;
  };
  isRealTime: boolean;
  updateInterval: number;
  createdAt: string;
  updatedAt: string;
}

export interface VisualizationFormData {
  name: string;
  type: Visualization['type'];
  dataSource: string;
  settings?: Partial<Visualization['settings']>;
  dataMappings?: Partial<Visualization['dataMappings']>;
  streamConfig?: Partial<Visualization['streamConfig']>;
  layout?: Partial<Visualization['layout']>;
  style?: Partial<Visualization['style']>;
  isRealTime?: boolean;
  updateInterval?: number;
}

export interface VisualizationUpdateData extends Partial<VisualizationFormData> {}
