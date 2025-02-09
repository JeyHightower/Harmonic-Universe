import PropTypes from 'prop-types';
import React from 'react';
import { usePhysics } from '../../hooks/usePhysics';

import { PlayArrow as PlayArrowIcon, Stop as StopIcon } from '@mui/icons-material';
import { Box, Button } from '@mui/material';

export const PhysicsObjectList = ({ projectId }) => {
  const {
    objects,
    loading,
    error,
    isSimulating,
    fetchPhysicsObjects,
    createPhysicsObject,
    updatePhysicsObject,
    deletePhysicsObject,
    startSimulation,
    stopSimulation,
  } = usePhysics(projectId);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [selectedObject, setSelectedObject] = React.useState(null);
  const [formData, setFormData] = React.useState({
    name: '',
    type: 'sphere',
    mass: 1,
    isStatic: false,
    material: {
      friction: 0.5,
      restitution: 0.5,
    },
  });

  React.useEffect(() => {
    fetchPhysicsObjects();
  }, [fetchPhysicsObjects]);

  const handleCreateDialogOpen = () => {
    setIsCreateDialogOpen(true);
  };

  const handleCreateDialogClose = () => {
    setIsCreateDialogOpen(false);
    setFormData({
      name: '',
      type: 'sphere',
      mass: 1,
      isStatic: false,
      material: {
        friction: 0.5,
        restitution: 0.5,
      },
    });
  };

  const handleCreate = async () => {
    await createPhysicsObject(formData);
    handleCreateDialogClose();
  };

  const handleEdit = object => {
    setSelectedObject(object);
  };

  const handleEditClose = () => {
    setSelectedObject(null);
  };

  const handleEditSave = async (objectId, updates) => {
    await updatePhysicsObject({ projectId, objectId, data: updates });
    setSelectedObject(null);
  };

  const handleDelete = async objectId => {
    await deletePhysicsObject({ projectId, objectId });
  };

  if (loading) {
    return <div>Loading physics objects...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!objects.length) {
    return (
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button variant="contained" onClick={handleCreateDialogOpen}>
          Create Object
        </Button>
        <Button
          variant="outlined"
          startIcon={isSimulating ? <StopIcon /> : <PlayArrowIcon />}
          onClick={() => (isSimulating ? stopSimulation() : startSimulation())}
        >
          {isSimulating ? 'Stop Simulation' : 'Start Simulation'}
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Button variant="contained" onClick={handleCreateDialogOpen}>
        Create Object
      </Button>
      <Button
        variant="outlined"
        startIcon={isSimulating ? <StopIcon /> : <PlayArrowIcon />}
        onClick={() => (isSimulating ? stopSimulation() : startSimulation())}
      >
        {isSimulating ? 'Stop Simulation' : 'Start Simulation'}
      </Button>
    </Box>
  );
};

PhysicsObjectList.propTypes = {
  projectId: PropTypes.string.isRequired,
};
