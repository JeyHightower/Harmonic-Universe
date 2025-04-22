import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Slider,
  Grid,
  Card,
  CardContent,
  Divider,
  Alert,
} from '@mui/material';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`physics-tabpanel-${index}`}
      aria-labelledby={`physics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// Add PropTypes for TabPanel
TabPanel.propTypes = {
  children: PropTypes.node,
  value: PropTypes.number.isRequired,
  index: PropTypes.number.isRequired,
};

function a11yProps(index) {
  return {
    id: `physics-tab-${index}`,
    'aria-controls': `physics-tabpanel-${index}`,
  };
}

export default function PhysicsEditor({ entityType, entityId }) {
  const [tabValue, setTabValue] = useState(0);
  const [physics2D, setPhysics2D] = useState(null);
  const [physics3D, setPhysics3D] = useState(null);
  const [objects, setObjects] = useState([]);
  const [constraints, setConstraints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [is2D, setIs2D] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch physics settings based on entity type and ID
        let response;

        // Fetch 2D physics if available
        response = await fetch(`/api/physics/2d?${entityType}_id=${entityId}`);
        const data2D = await response.json();
        if (data2D.success && data2D.data.length > 0) {
          setPhysics2D(data2D.data[0]);
        }

        // Fetch 3D physics if available
        response = await fetch(`/api/physics/3d?${entityType}_id=${entityId}`);
        const data3D = await response.json();
        if (data3D.success && data3D.data.length > 0) {
          setPhysics3D(data3D.data[0]);
        }

        // Fetch physics objects
        response = await fetch(`/api/physics/objects?${entityType}_id=${entityId}`);
        const objectsData = await response.json();
        if (objectsData.success) {
          setObjects(objectsData.data);
        }

        // Fetch physics constraints
        if (entityType === 'scene') {
          response = await fetch(`/api/physics/constraints?scene_id=${entityId}`);
          const constraintsData = await response.json();
          if (constraintsData.success) {
            setConstraints(constraintsData.data);
          }
        }

        // Determine if entity uses 2D or 3D physics
        response = await fetch(`/api/${entityType}s/${entityId}`);
        const entityData = await response.json();
        if (entityData.success) {
          setIs2D(entityData.data.is_2d !== false); // Default to true if not specified
        }
      } catch (err) {
        setError('Error loading physics data: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (entityId) {
      fetchData();
    }
  }, [entityType, entityId]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSavePhysics2D = async () => {
    try {
      const method = physics2D.id ? 'PUT' : 'POST';
      const url = physics2D.id ? `/api/physics/2d/${physics2D.id}` : `/api/physics/2d`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(physics2D),
      });

      const data = await response.json();
      if (data.success) {
        setPhysics2D(data.data);
        setError(null);
      } else {
        setError(data.error || 'Failed to save 2D physics settings');
      }
    } catch (err) {
      setError('Error saving 2D physics settings: ' + err.message);
    }
  };

  const handleSavePhysics3D = async () => {
    try {
      const method = physics3D.id ? 'PUT' : 'POST';
      const url = physics3D.id ? `/api/physics/3d/${physics3D.id}` : `/api/physics/3d`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(physics3D),
      });

      const data = await response.json();
      if (data.success) {
        setPhysics3D(data.data);
        setError(null);
      } else {
        setError(data.error || 'Failed to save 3D physics settings');
      }
    } catch (err) {
      setError('Error saving 3D physics settings: ' + err.message);
    }
  };

  const handleChange2D = (e) => {
    const { name, value, type, checked } = e.target;
    setPhysics2D((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleChange3D = (e) => {
    const { name, value, type, checked } = e.target;
    setPhysics3D((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const createNew2DPhysics = () => {
    setPhysics2D({
      name: `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} Physics`,
      description: `2D physics for this ${entityType}`,
      gravity_x: 0.0,
      gravity_y: 9.8,
      friction: 0.1,
      restitution: 0.5,
      linear_damping: 0.1,
      angular_damping: 0.1,
      time_scale: 1.0,
      [`${entityType}_id`]: entityId,
    });
  };

  const createNew3DPhysics = () => {
    setPhysics3D({
      name: `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} Physics`,
      description: `3D physics for this ${entityType}`,
      gravity_x: 0.0,
      gravity_y: -9.8,
      gravity_z: 0.0,
      friction: 0.3,
      restitution: 0.5,
      linear_damping: 0.05,
      angular_damping: 0.05,
      collision_margin: 0.04,
      continuous_detection: true,
      substeps: 2,
      solver_iterations: 10,
      time_scale: 1.0,
      [`${entityType}_id`]: entityId,
    });
  };

  if (loading) {
    return <Typography>Loading physics data...</Typography>;
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="physics tabs">
          <Tab label="Physics Settings" {...a11yProps(0)} />
          <Tab label="Objects" {...a11yProps(1)} />
          {entityType === 'scene' && <Tab label="Constraints" {...a11yProps(2)} />}
        </Tabs>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={<Switch checked={is2D} onChange={() => setIs2D(!is2D)} />}
            label={is2D ? '2D Physics' : '3D Physics'}
          />
          <Typography variant="caption" display="block">
            Set the physics mode to 2D or 3D. This affects how physics calculations are performed.
          </Typography>
        </Box>

        {is2D ? (
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                2D Physics Settings
              </Typography>

              {!physics2D ? (
                <Box sx={{ my: 2 }}>
                  <Typography>No 2D physics settings found for this {entityType}.</Typography>
                  <Button variant="contained" onClick={createNew2DPhysics} sx={{ mt: 1 }}>
                    Create New
                  </Button>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Name"
                      name="name"
                      value={physics2D.name || ''}
                      onChange={handleChange2D}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      name="description"
                      value={physics2D.description || ''}
                      onChange={handleChange2D}
                      margin="normal"
                      multiline
                      rows={2}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography id="gravity-x-slider" gutterBottom>
                      Gravity X: {physics2D.gravity_x}
                    </Typography>
                    <Slider
                      name="gravity_x"
                      value={parseFloat(physics2D.gravity_x) || 0}
                      onChange={(e, newValue) =>
                        setPhysics2D((prev) => ({
                          ...prev,
                          gravity_x: newValue,
                        }))
                      }
                      min={-20}
                      max={20}
                      step={0.1}
                      valueLabelDisplay="auto"
                      aria-labelledby="gravity-x-slider"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography id="gravity-y-slider" gutterBottom>
                      Gravity Y: {physics2D.gravity_y}
                    </Typography>
                    <Slider
                      name="gravity_y"
                      value={parseFloat(physics2D.gravity_y) || 0}
                      onChange={(e, newValue) =>
                        setPhysics2D((prev) => ({
                          ...prev,
                          gravity_y: newValue,
                        }))
                      }
                      min={-20}
                      max={20}
                      step={0.1}
                      valueLabelDisplay="auto"
                      aria-labelledby="gravity-y-slider"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography id="friction-slider" gutterBottom>
                      Friction: {physics2D.friction}
                    </Typography>
                    <Slider
                      name="friction"
                      value={parseFloat(physics2D.friction) || 0}
                      onChange={(e, newValue) =>
                        setPhysics2D((prev) => ({
                          ...prev,
                          friction: newValue,
                        }))
                      }
                      min={0}
                      max={1}
                      step={0.01}
                      valueLabelDisplay="auto"
                      aria-labelledby="friction-slider"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography id="restitution-slider" gutterBottom>
                      Restitution (Bounce): {physics2D.restitution}
                    </Typography>
                    <Slider
                      name="restitution"
                      value={parseFloat(physics2D.restitution) || 0}
                      onChange={(e, newValue) =>
                        setPhysics2D((prev) => ({
                          ...prev,
                          restitution: newValue,
                        }))
                      }
                      min={0}
                      max={1}
                      step={0.01}
                      valueLabelDisplay="auto"
                      aria-labelledby="restitution-slider"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography id="linear-damping-slider" gutterBottom>
                      Linear Damping: {physics2D.linear_damping}
                    </Typography>
                    <Slider
                      name="linear_damping"
                      value={parseFloat(physics2D.linear_damping) || 0}
                      onChange={(e, newValue) =>
                        setPhysics2D((prev) => ({
                          ...prev,
                          linear_damping: newValue,
                        }))
                      }
                      min={0}
                      max={1}
                      step={0.01}
                      valueLabelDisplay="auto"
                      aria-labelledby="linear-damping-slider"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography id="angular-damping-slider" gutterBottom>
                      Angular Damping: {physics2D.angular_damping}
                    </Typography>
                    <Slider
                      name="angular_damping"
                      value={parseFloat(physics2D.angular_damping) || 0}
                      onChange={(e, newValue) =>
                        setPhysics2D((prev) => ({
                          ...prev,
                          angular_damping: newValue,
                        }))
                      }
                      min={0}
                      max={1}
                      step={0.01}
                      valueLabelDisplay="auto"
                      aria-labelledby="angular-damping-slider"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography id="time-scale-slider" gutterBottom>
                      Time Scale: {physics2D.time_scale}x
                    </Typography>
                    <Slider
                      name="time_scale"
                      value={parseFloat(physics2D.time_scale) || 1}
                      onChange={(e, newValue) =>
                        setPhysics2D((prev) => ({
                          ...prev,
                          time_scale: newValue,
                        }))
                      }
                      min={0.1}
                      max={2}
                      step={0.1}
                      valueLabelDisplay="auto"
                      aria-labelledby="time-scale-slider"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSavePhysics2D}
                      sx={{ mt: 2 }}
                    >
                      Save 2D Physics Settings
                    </Button>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                3D Physics Settings
              </Typography>

              {!physics3D ? (
                <Box sx={{ my: 2 }}>
                  <Typography>No 3D physics settings found for this {entityType}.</Typography>
                  <Button variant="contained" onClick={createNew3DPhysics} sx={{ mt: 1 }}>
                    Create New
                  </Button>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Name"
                      name="name"
                      value={physics3D.name || ''}
                      onChange={handleChange3D}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      name="description"
                      value={physics3D.description || ''}
                      onChange={handleChange3D}
                      margin="normal"
                      multiline
                      rows={2}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                      Gravity
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Typography id="gravity-x-slider-3d" gutterBottom>
                      X: {physics3D.gravity_x}
                    </Typography>
                    <Slider
                      name="gravity_x"
                      value={parseFloat(physics3D.gravity_x) || 0}
                      onChange={(e, newValue) =>
                        setPhysics3D((prev) => ({
                          ...prev,
                          gravity_x: newValue,
                        }))
                      }
                      min={-20}
                      max={20}
                      step={0.1}
                      valueLabelDisplay="auto"
                      aria-labelledby="gravity-x-slider-3d"
                    />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Typography id="gravity-y-slider-3d" gutterBottom>
                      Y: {physics3D.gravity_y}
                    </Typography>
                    <Slider
                      name="gravity_y"
                      value={parseFloat(physics3D.gravity_y) || 0}
                      onChange={(e, newValue) =>
                        setPhysics3D((prev) => ({
                          ...prev,
                          gravity_y: newValue,
                        }))
                      }
                      min={-20}
                      max={20}
                      step={0.1}
                      valueLabelDisplay="auto"
                      aria-labelledby="gravity-y-slider-3d"
                    />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Typography id="gravity-z-slider-3d" gutterBottom>
                      Z: {physics3D.gravity_z}
                    </Typography>
                    <Slider
                      name="gravity_z"
                      value={parseFloat(physics3D.gravity_z) || 0}
                      onChange={(e, newValue) =>
                        setPhysics3D((prev) => ({
                          ...prev,
                          gravity_z: newValue,
                        }))
                      }
                      min={-20}
                      max={20}
                      step={0.1}
                      valueLabelDisplay="auto"
                      aria-labelledby="gravity-z-slider-3d"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ mt: 1, mb: 2 }} />
                    <Typography variant="subtitle1" gutterBottom>
                      Material Properties
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography id="friction-slider-3d" gutterBottom>
                      Friction: {physics3D.friction}
                    </Typography>
                    <Slider
                      name="friction"
                      value={parseFloat(physics3D.friction) || 0}
                      onChange={(e, newValue) =>
                        setPhysics3D((prev) => ({
                          ...prev,
                          friction: newValue,
                        }))
                      }
                      min={0}
                      max={1}
                      step={0.01}
                      valueLabelDisplay="auto"
                      aria-labelledby="friction-slider-3d"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography id="restitution-slider-3d" gutterBottom>
                      Restitution (Bounce): {physics3D.restitution}
                    </Typography>
                    <Slider
                      name="restitution"
                      value={parseFloat(physics3D.restitution) || 0}
                      onChange={(e, newValue) =>
                        setPhysics3D((prev) => ({
                          ...prev,
                          restitution: newValue,
                        }))
                      }
                      min={0}
                      max={1}
                      step={0.01}
                      valueLabelDisplay="auto"
                      aria-labelledby="restitution-slider-3d"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ mt: 1, mb: 2 }} />
                    <Typography variant="subtitle1" gutterBottom>
                      Advanced Settings
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography id="collision-margin-slider" gutterBottom>
                      Collision Margin: {physics3D.collision_margin}
                    </Typography>
                    <Slider
                      name="collision_margin"
                      value={parseFloat(physics3D.collision_margin) || 0}
                      onChange={(e, newValue) =>
                        setPhysics3D((prev) => ({
                          ...prev,
                          collision_margin: newValue,
                        }))
                      }
                      min={0}
                      max={0.1}
                      step={0.001}
                      valueLabelDisplay="auto"
                      aria-labelledby="collision-margin-slider"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography id="time-scale-slider-3d" gutterBottom>
                      Time Scale: {physics3D.time_scale}x
                    </Typography>
                    <Slider
                      name="time_scale"
                      value={parseFloat(physics3D.time_scale) || 1}
                      onChange={(e, newValue) =>
                        setPhysics3D((prev) => ({
                          ...prev,
                          time_scale: newValue,
                        }))
                      }
                      min={0.1}
                      max={2}
                      step={0.1}
                      valueLabelDisplay="auto"
                      aria-labelledby="time-scale-slider-3d"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Solver Iterations"
                      name="solver_iterations"
                      type="number"
                      value={physics3D.solver_iterations || 10}
                      onChange={handleChange3D}
                      margin="normal"
                      inputProps={{ min: 1, max: 50 }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Substeps"
                      name="substeps"
                      type="number"
                      value={physics3D.substeps || 2}
                      onChange={handleChange3D}
                      margin="normal"
                      inputProps={{ min: 1, max: 10 }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={physics3D.continuous_detection === true}
                          onChange={(e) =>
                            setPhysics3D((prev) => ({
                              ...prev,
                              continuous_detection: e.target.checked,
                            }))
                          }
                          name="continuous_detection"
                        />
                      }
                      label="Continuous Collision Detection"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSavePhysics3D}
                      sx={{ mt: 2 }}
                    >
                      Save 3D Physics Settings
                    </Button>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" gutterBottom>
          Physics Objects
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Button
            variant="contained"
            onClick={() => navigate(`/${entityType}s/${entityId}/physics/objects/new`)}
          >
            Add New Object
          </Button>
        </Box>

        {objects.length === 0 ? (
          <Typography>
            No physics objects found. Add some to enable physics interactions.
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {objects.map((obj) => (
              <Grid item xs={12} sm={6} md={4} key={obj.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6">{obj.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {obj.object_type} ({obj.is_2d ? '2D' : '3D'})
                    </Typography>
                    <Typography variant="body2">
                      {obj.is_static ? 'Static (Immovable)' : 'Dynamic'}
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      sx={{ mt: 1 }}
                      onClick={() =>
                        navigate(`/${entityType}s/${entityId}/physics/objects/${obj.id}`)
                      }
                    >
                      Edit
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {entityType === 'scene' && (
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Physics Constraints
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              onClick={() => navigate(`/scenes/${entityId}/physics/constraints/new`)}
            >
              Add New Constraint
            </Button>
          </Box>

          {constraints.length === 0 ? (
            <Typography>
              No physics constraints found. Constraints connect objects together with various joint
              types.
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {constraints.map((constraint) => (
                <Grid item xs={12} sm={6} md={4} key={constraint.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6">{constraint.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {constraint.constraint_type}
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        sx={{ mt: 1 }}
                        onClick={() =>
                          navigate(`/scenes/${entityId}/physics/constraints/${constraint.id}`)
                        }
                      >
                        Edit
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>
      )}
    </Box>
  );
}

// Add PropTypes for PhysicsEditor
PhysicsEditor.propTypes = {
  entityType: PropTypes.string.isRequired,
  entityId: PropTypes.string.isRequired,
};
