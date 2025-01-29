export interface Scene {
  id: number;
  storyboard_id: number;
  title: string;
  sequence: number;
  content: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SceneState {
  scenes: Scene[];
  currentScene: Scene | null;
  isLoading: boolean;
  error: string | null;
}

export interface SceneFormData {
  title: string;
  sequence: number;
  content: Record<string, any>;
}

export interface SceneEditorProps {
  universeId: number;
  storyboardId: number;
  sceneId: number;
}

export interface SceneDialogState {
  open: boolean;
  mode: 'create' | 'edit';
  sceneId?: number;
  title: string;
  sequence: number;
  content: Record<string, any>;
}

export interface DragDropResult {
  draggableId: string;
  type: string;
  source: {
    index: number;
    droppableId: string;
  };
  destination?: {
    index: number;
    droppableId: string;
  };
  reason: 'DROP' | 'CANCEL';
}

