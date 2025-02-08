import { useCollaboration } from '@/contexts/CollaborationContext';
import { selectCurrentUser } from '@/store/slices/authSlice';
import { format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useSelector } from 'react-redux';

const CommentThread = ({ comment, onReply, onResolve }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const currentUser = useSelector(selectCurrentUser);

  const handleSubmitReply = e => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    onReply(comment.id, replyContent);
    setReplyContent('');
    setIsReplying(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="border rounded-lg p-4 bg-white shadow-sm"
    >
      {/* Main Comment */}
      <div className="flex items-start gap-3">
        <img
          src={comment.author.avatar || '/default-avatar.png'}
          alt={comment.author.username}
          className="w-8 h-8 rounded-full"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{comment.author.username}</span>
            <span className="text-sm text-gray-500">
              {format(new Date(comment.timestamp), 'MMM d, yyyy HH:mm')}
            </span>
          </div>
          <p className="mt-1 text-gray-800">{comment.content}</p>

          {/* Actions */}
          <div className="mt-2 flex gap-4">
            <button
              onClick={() => setIsReplying(!isReplying)}
              className="text-sm text-blue-500 hover:text-blue-600"
            >
              Reply
            </button>
            {!comment.resolved && (
              <button
                onClick={() => onResolve(comment.id)}
                className="text-sm text-green-500 hover:text-green-600"
              >
                Resolve
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Replies */}
      <div className="ml-8 mt-4 space-y-4">
        {comment.replies?.map(reply => (
          <div key={reply.id} className="flex items-start gap-3">
            <img
              src={reply.author.avatar || '/default-avatar.png'}
              alt={reply.author.username}
              className="w-6 h-6 rounded-full"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{reply.author.username}</span>
                <span className="text-sm text-gray-500">
                  {format(new Date(reply.timestamp), 'MMM d, yyyy HH:mm')}
                </span>
              </div>
              <p className="mt-1 text-gray-800">{reply.content}</p>
            </div>
          </div>
        ))}

        {/* Reply Form */}
        {isReplying && (
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmitReply}
            className="mt-2"
          >
            <textarea
              value={replyContent}
              onChange={e => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              className="w-full p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsReplying(false)}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!replyContent.trim()}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                Submit
              </button>
            </div>
          </motion.form>
        )}
      </div>
    </motion.div>
  );
};

const CommentsSystem = () => {
  const [newComment, setNewComment] = useState('');
  const [selectedPosition, setSelectedPosition] = useState(null);
  const { comments, addComment, addReply, resolveComment } = useCollaboration();
  const currentUser = useSelector(selectCurrentUser);

  const handleAddComment = e => {
    e.preventDefault();
    if (!newComment.trim() || !selectedPosition) return;

    addComment({
      content: newComment.trim(),
      position: selectedPosition,
      timestamp: new Date().toISOString(),
    });

    setNewComment('');
    setSelectedPosition(null);
  };

  const handleCanvasClick = e => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setSelectedPosition({ x, y });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {comments.map(comment => (
            <CommentThread
              key={comment.id}
              comment={comment}
              onReply={addReply}
              onResolve={resolveComment}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Comment Markers */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1000 }}>
        {comments
          .filter(c => !c.resolved)
          .map(comment => (
            <motion.div
              key={comment.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute w-6 h-6 -ml-3 -mt-3 bg-yellow-400 rounded-full border-2 border-white shadow-lg"
              style={{
                left: `${comment.position.x * 100}%`,
                top: `${comment.position.y * 100}%`,
              }}
            />
          ))}
      </div>

      {/* New Comment Form */}
      {selectedPosition && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="p-4 border-t bg-white"
        >
          <form onSubmit={handleAddComment}>
            <textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedPosition(null)}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                Add Comment
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </div>
  );
};

export default CommentsSystem;
