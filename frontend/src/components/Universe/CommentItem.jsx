import { Comment } from "@/types/comment";
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Reply as ReplyIcon,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState } from "react";

interface CommentItemProps {
  comment: Comment;
  universeId: number;
  currentUserId: number;
  onReply: (parentId: number) => void;
  onEdit: (comment: Comment) => void;
  onDelete: (commentId: number) => void;
  formatDate: (date: string) => string;
  depth?: number;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  universeId,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  formatDate,
  depth = 0,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");

  const isOwner = currentUserId === comment.user_id;
  const maxDepth = 3; // Maximum nesting level for replies

  const handleEditSubmit = () => {
    if (editedContent.trim() !== comment.content) {
      onEdit({ ...comment, content: editedContent.trim() });
    }
    setIsEditing(false);
  };

  const handleReplySubmit = () => {
    if (replyContent.trim()) {
      onReply(comment.id);
      setReplyContent("");
      setShowReplyForm(false);
    }
  };

  return (
    <Card
      sx={{
        mb: 2,
        ml: depth * 3,
        maxWidth: `calc(100% - ${depth * 24}px)`,
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" mb={1}>
          <Avatar
            src={comment.user?.avatar}
            alt={comment.user?.username}
            sx={{ width: 32, height: 32, mr: 1 }}
          >
            {comment.user?.username?.[0]?.toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" component="span">
              {comment.user?.username}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              {formatDate(comment.created_at)}
              {comment.is_edited && " (edited)"}
            </Typography>
          </Box>
        </Box>

        {isEditing ? (
          <Box mt={1}>
            <TextField
              fullWidth
              multiline
              minRows={2}
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              variant="outlined"
              size="small"
            />
            <Box mt={1}>
              <Button
                size="small"
                variant="contained"
                onClick={handleEditSubmit}
                sx={{ mr: 1 }}
              >
                Save
              </Button>
              <Button
                size="small"
                onClick={() => {
                  setIsEditing(false);
                  setEditedContent(comment.content);
                }}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        ) : (
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
            {comment.content}
          </Typography>
        )}

        <Box mt={1} display="flex" alignItems="center">
          {depth < maxDepth && (
            <Button
              size="small"
              startIcon={<ReplyIcon />}
              onClick={() => setShowReplyForm(!showReplyForm)}
            >
              Reply
            </Button>
          )}
          {isOwner && (
            <>
              <IconButton
                size="small"
                onClick={() => setIsEditing(true)}
                sx={{ ml: 1 }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => onDelete(comment.id)}
                sx={{ ml: 1 }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </>
          )}
        </Box>

        {showReplyForm && (
          <Box mt={2}>
            <TextField
              fullWidth
              multiline
              minRows={2}
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              variant="outlined"
              size="small"
            />
            <Box mt={1}>
              <Button
                size="small"
                variant="contained"
                onClick={handleReplySubmit}
                disabled={!replyContent.trim()}
                sx={{ mr: 1 }}
              >
                Reply
              </Button>
              <Button
                size="small"
                onClick={() => {
                  setShowReplyForm(false);
                  setReplyContent("");
                }}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        )}

        {comment.replies?.map((reply) => (
          <CommentItem
            key={reply.id}
            comment={reply}
            universeId={universeId}
            currentUserId={currentUserId}
            onReply={onReply}
            onEdit={onEdit}
            onDelete={onDelete}
            formatDate={formatDate}
            depth={depth + 1}
          />
        ))}
      </CardContent>
    </Card>
  );
};

export default CommentItem;
