import {
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { universeService } from '../../services/universeService';
import { userService } from '../../services/userService';

const ShareDialog = ({
  open,
  onClose,
  universeId,
  currentCollaborators = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [collaborators, setCollaborators] = useState(currentCollaborators);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setCollaborators(currentCollaborators);
  }, [currentCollaborators]);

  const handleSearch = async query => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const users = await userService.searchUsers(query);
      setSearchResults(
        users.filter(
          user => !collaborators.some(collab => collab.id === user.id)
        )
      );
    } catch (err) {
      setError('Failed to search users');
    }
  };

  const handleAddCollaborator = async user => {
    setLoading(true);
    setError(null);
    try {
      await universeService.shareUniverse(universeId, user.id);
      setCollaborators([...collaborators, user]);
      setSearchResults(searchResults.filter(u => u.id !== user.id));
      setSearchQuery('');
    } catch (err) {
      setError('Failed to add collaborator');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCollaborator = async userId => {
    setLoading(true);
    setError(null);
    try {
      await universeService.unshareUniverse(universeId, userId);
      setCollaborators(collaborators.filter(c => c.id !== userId));
    } catch (err) {
      setError('Failed to remove collaborator');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Share Universe</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            label="Search users"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              handleSearch(e.target.value);
            }}
            placeholder="Type to search users..."
          />
        </Box>

        {searchResults.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Search Results
            </Typography>
            <List>
              {searchResults.map(user => (
                <ListItem key={user.id}>
                  <ListItemAvatar>
                    <Avatar>{user.username[0]}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={user.username}
                    secondary={user.email}
                  />
                  <ListItemSecondaryAction>
                    <Button
                      startIcon={<PersonAddIcon />}
                      onClick={() => handleAddCollaborator(user)}
                      disabled={loading}
                    >
                      Add
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Current Collaborators
          </Typography>
          {collaborators.length > 0 ? (
            <List>
              {collaborators.map(user => (
                <ListItem key={user.id}>
                  <ListItemAvatar>
                    <Avatar>{user.username[0]}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={user.username}
                    secondary={user.email}
                  />
                  <ListItemSecondaryAction>
                    <Button
                      startIcon={<DeleteIcon />}
                      color="error"
                      onClick={() => handleRemoveCollaborator(user.id)}
                      disabled={loading}
                    >
                      Remove
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography color="text.secondary">No collaborators yet</Typography>
          )}
        </Box>

        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Done</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShareDialog;
