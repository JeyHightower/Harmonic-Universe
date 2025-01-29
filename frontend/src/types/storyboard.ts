export interface Storyboard {
  id: number;
  universe_id: number;
  title: string;
  description: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface StoryboardState {
  storyboards: Storyboard[];
  currentStoryboard: Storyboard | null;
  isLoading: boolean;
  error: string | null;
}

export interface StoryboardFormData {
  title: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface StoryboardEditorProps {
  universeId: number;
  storyboardId: number;
}

export interface StoryboardDialogState {
  open: boolean;
  mode: 'create' | 'edit';
  storyboardId?: number;
  title: string;
  description: string;
  metadata: Record<string, any>;
}

