import { Comment } from '@/types/comment';
import { formatDistanceToNow } from 'date-fns';
import React from 'react';
import CommentItem from './CommentItem';

interface CommentListProps {
  comments: Comment[];
  universeId: number;
  currentUserId: number;
  onReply: (parentId: number) => void;
  onEdit: (comment: Comment) => void;
  onDelete: (commentId: number) => void;
}

const CommentList: React.FC<CommentListProps> = ({
  comments,
  universeId,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
}) => {
  if (!comments.length) {
    return (
      <div className="text-center py-4 text-gray-500">
        No comments yet. Be the first to comment!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map(comment => (
        <CommentItem
          key={comment.id}
          comment={comment}
          universeId={universeId}
          currentUserId={currentUserId}
          onReply={onReply}
          onEdit={onEdit}
          onDelete={onDelete}
          formatDate={date =>
            formatDistanceToNow(new Date(date), { addSuffix: true })
          }
        />
      ))}
    </div>
  );
};

export default CommentList;
