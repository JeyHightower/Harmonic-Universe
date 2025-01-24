export interface Comment {
  id: number;
  universe_id: number;
  user_id: number;
  parent_id: number | null;
  content: string;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  user?: {
    id: number;
    username: string;
    email: string;
    avatar?: string;
  };
  replies?: Comment[];
}

export interface CommentState {
  comments: Comment[];
  userComments: Comment[];
  loading: boolean;
  error: string | null;
}

export interface AddCommentPayload {
  universeId: number;
  content: string;
  parentId?: number;
}

export interface UpdateCommentPayload {
  universeId: number;
  commentId: number;
  content: string;
}

export interface DeleteCommentPayload {
  universeId: number;
  commentId: number;
}
