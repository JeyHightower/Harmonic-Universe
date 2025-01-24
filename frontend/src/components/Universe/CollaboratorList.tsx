import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import {
  Box,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Typography,
} from '@mui/material';
import React from 'react';

interface Collaborator {
  id: number;
  user_id: number;
  role: string;
  user: {
    username: string;
    email: string;
  };
}

interface CollaboratorListProps {
  collaborators: Collaborator[];
  isOwner: boolean;
  onEdit: (collaborator: Collaborator) => void;
  onDelete: (userId: number) => void;
}

const CollaboratorList: React.FC<CollaboratorListProps> = ({
  collaborators,
  isOwner,
  onEdit,
  onDelete,
}) => {
  if (!collaborators.length) {
    return (
      <Box textAlign="center" py={2}>
        <Typography color="textSecondary">No collaborators yet</Typography>
      </Box>
    );
  }

  return (
    <List>
      {collaborators.map(collaborator => (
        <ListItem key={collaborator.id}>
          <ListItemText
            primary={collaborator.user.username}
            secondary={`Role: ${collaborator.role}`}
          />
          {isOwner && (
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                aria-label="edit"
                onClick={() => onEdit(collaborator)}
              >
                <EditIcon />
              </IconButton>
              <IconButton
                edge="end"
                aria-label="delete"
                onClick={() => onDelete(collaborator.user_id)}
              >
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          )}
        </ListItem>
      ))}
    </List>
  );
};

export default CollaboratorList;
