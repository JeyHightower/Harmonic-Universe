export interface Project {
  id: number;
  title: string;
  description: string;
  isPublic: boolean;
  userId: number;
  createdAt: string;
  updatedAt: string;
  audioTracks: number[];
  visualizations: number[];
  physicsObjects: number[];
}

export interface ProjectFormData {
  title: string;
  description: string;
  isPublic: boolean;
}

export interface ProjectUpdateData {
  title?: string;
  description?: string;
  isPublic?: boolean;
}
