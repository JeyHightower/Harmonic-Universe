import api from "@/services/api";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import React, { useState } from "react";

interface User {
  id: number;
  username: string;
  email: string;
}

interface AddCollaboratorDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (userId: number, role: string) => void;
}

const AddCollaboratorDialog: React.FC<AddCollaboratorDialogProps> = ({
  open,
  onClose,
  onAdd,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState("viewer");

  const handleSearch = async (query: string) => {
    if (query.length < 2) return;
    try {
      const response = await api.get(`/api/users/search?q=${query}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error("Failed to search users:", error);
    }
  };

  const handleSubmit = () => {
    if (selectedUser) {
      onAdd(selectedUser, selectedRole);
      handleClose();
    }
  };

  const handleClose = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedUser(null);
    setSelectedRole("viewer");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Collaborator</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="Search Users"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            handleSearch(e.target.value);
          }}
          margin="normal"
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>Role</InputLabel>
          <Select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            label="Role"
          >
            <MenuItem value="viewer">Viewer</MenuItem>
            <MenuItem value="editor">Editor</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </Select>
        </FormControl>
        <List>
          {searchResults.map((user) => (
            <ListItem
              button
              key={user.id}
              onClick={() => setSelectedUser(user.id)}
              selected={selectedUser === user.id}
            >
              <ListItemText primary={user.username} secondary={user.email} />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          disabled={!selectedUser}
          variant="contained"
          color="primary"
        >
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddCollaboratorDialog;
