import AddIcon from '@mui/icons-material/Add';
import {
    Box,
    Button,
    Grid,
    Paper,
    Typography,
} from '@mui/material';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectPhysicsConstraints, selectPhysicsObjects } from '../../store/physicsSlice';
import PhysicsConstraintEditor from '../PhysicsConstraintEditor';
import PhysicsEngine from '../PhysicsEngine';
import PhysicsObjectEditor from '../PhysicsObjectEditor';

const PhysicsPanel = ({ sceneId }) => {
  const dispatch = useDispatch();
  const [objectEditorOpen, setObjectEditorOpen] = useState(false);
  const [constraintEditorOpen, setConstraintEditorOpen] = useState(false);
  const [selectedObjectId, setSelectedObjectId] = useState(null);
  const [selectedConstraintId, setSelectedConstraintId] = useState(null);

  const physicsObjects = useSelector(selectPhysicsObjects);
  const physicsConstraints = useSelector(selectPhysicsConstraints);

  const sceneObjects = Object.values(physicsObjects).filter(obj => obj.scene_id === sceneId);
  const sceneConstraints = Object.values(physicsConstraints).filter(
    constraint => sceneObjects.some(obj => obj.id === constraint.object_a_id)
  );

  const handleAddObject = () => {
    setSelectedObjectId(null);
    setObjectEditorOpen(true);
  };

  const handleEditObject = (objectId) => {
    setSelectedObjectId(objectId);
    setObjectEditorOpen(true);
  };

  const handleAddConstraint = () => {
    setSelectedConstraintId(null);
    setConstraintEditorOpen(true);
  };

  const handleEditConstraint = (constraintId) => {
    setSelectedConstraintId(constraintId);
    setConstraintEditorOpen(true);
  };

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <PhysicsEngine
              sceneId={sceneId}
              width={800}
              height={600}
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Physics Objects</Typography>
              <Button
                startIcon={<AddIcon />}
                variant="contained"
                color="primary"
                onClick={handleAddObject}
              >
                Add Object
              </Button>
            </Box>

            {sceneObjects.map(object => (
              <Box
                key={object.id}
                sx={{
                  p: 1,
                  mb: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
                onClick={() => handleEditObject(object.id)}
              >
                <Typography variant="subtitle1">{object.name}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {object.object_type} - Mass: {object.mass}
                </Typography>
              </Box>
            ))}
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Physics Constraints</Typography>
              <Button
                startIcon={<AddIcon />}
                variant="contained"
                color="primary"
                onClick={handleAddConstraint}
                disabled={sceneObjects.length < 2}
              >
                Add Constraint
              </Button>
            </Box>

            {sceneConstraints.map(constraint => (
              <Box
                key={constraint.id}
                sx={{
                  p: 1,
                  mb: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
                onClick={() => handleEditConstraint(constraint.id)}
              >
                <Typography variant="subtitle1">
                  {constraint.constraint_type}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Stiffness: {constraint.stiffness} - Damping: {constraint.damping}
                </Typography>
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>

      <PhysicsObjectEditor
        open={objectEditorOpen}
        onClose={() => setObjectEditorOpen(false)}
        sceneId={sceneId}
        objectId={selectedObjectId}
        initialData={selectedObjectId ? physicsObjects[selectedObjectId] : null}
      />

      <PhysicsConstraintEditor
        open={constraintEditorOpen}
        onClose={() => setConstraintEditorOpen(false)}
        sceneId={sceneId}
        constraintId={selectedConstraintId}
        initialData={selectedConstraintId ? physicsConstraints[selectedConstraintId] : null}
      />
    </Box>
  );
};

export default PhysicsPanel;
