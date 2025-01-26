import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import {
  addCollaborator,
  fetchCollaborators,
  removeCollaborator,
  updateCollaborator,
} from "@/store/slices/collaboratorSlice";
import { Box, Button, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import AddCollaboratorDialog from "./AddCollaboratorDialog";
import CollaboratorList from "./CollaboratorList";

interface CollaboratorManagerProps {
  universeId: number;
  isOwner: boolean;
}

const CollaboratorManager: React.FC<CollaboratorManagerProps> = ({
  universeId,
  isOwner,
}) => {
  const dispatch = useAppDispatch();
  const { collaborators, loading, error } = useAppSelector(
    (state) => state.collaborators,
  );
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchCollaborators(universeId));
  }, [dispatch, universeId]);

  const handleAddCollaborator = async (userId: number, role: string) => {
    try {
      await dispatch(
        addCollaborator({
          universeId,
          userId,
          role,
        }),
      ).unwrap();
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Failed to add collaborator:", error);
    }
  };

  const handleEditCollaborator = async (collaborator: {
    user_id: number;
    role: string;
  }) => {
    try {
      await dispatch(
        updateCollaborator({
          universeId,
          userId: collaborator.user_id,
          role: collaborator.role,
        }),
      ).unwrap();
    } catch (error) {
      console.error("Failed to update collaborator:", error);
    }
  };

  const handleDeleteCollaborator = async (userId: number) => {
    try {
      await dispatch(
        removeCollaborator({
          universeId,
          userId,
        }),
      ).unwrap();
    } catch (error) {
      console.error("Failed to remove collaborator:", error);
    }
  };

  if (loading) {
    return (
      <Box textAlign="center" py={2}>
        <Typography>Loading collaborators...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" py={2}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h6">Collaborators</Typography>
        {isOwner && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => setIsAddDialogOpen(true)}
          >
            Add Collaborator
          </Button>
        )}
      </Box>

      <CollaboratorList
        collaborators={collaborators}
        isOwner={isOwner}
        onEdit={handleEditCollaborator}
        onDelete={handleDeleteCollaborator}
      />

      <AddCollaboratorDialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAdd={handleAddCollaborator}
      />
    </Box>
  );
};

export default CollaboratorManager;
