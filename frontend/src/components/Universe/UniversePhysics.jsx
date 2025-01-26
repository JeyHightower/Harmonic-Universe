import {
    Box,
    Card,
    CardContent,
    Grid,
    Slider,
    Switch,
    Typography,
    alpha,
    styled,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { websocketService } from '../../services/websocketService';
import { updateUniverseParameters } from '../../store/slices/universeSlice';

const ParameterCard = styled(Card)(({ theme }) => ({
  height: '100%',
  backgroundColor: alpha(theme.palette.background.paper, 0.6),
  backdropFilter: 'blur(8px)',
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

const SliderContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2, 3),
}));

interface PhysicsParams {
  gravity: number;
  friction: number;
  elasticity: number;
  airResistance: number;
  collisionsEnabled: boolean;
  particleMass: number;
  timeScale: number;
}

interface UniversePhysicsProps {
  universe: {
    id: number;
    physics_parameters: PhysicsParams;
  };
}

const UniversePhysics: React.FC<UniversePhysicsProps> = ({ universe }) => {
  const dispatch = useDispatch();
  const [physicsParams, setPhysicsParams] = useState<PhysicsParams>({
    gravity: 9.81,
    friction: 0.5,
    elasticity: 0.7,
    airResistance: 0.1,
    collisionsEnabled: true,
    particleMass: 1.0,
    timeScale: 1.0,
  });

  useEffect(() => {
    if (universe.physics_parameters) {
      setPhysicsParams(universe.physics_parameters);
    }
  }, [universe.physics_parameters]);

  const handleParamChange = (param: keyof PhysicsParams) => (
    event: Event,
    newValue: number | number[] | boolean
  ) => {
    const updatedParams = {
      ...physicsParams,
      [param]: newValue,
    };
    setPhysicsParams(updatedParams);

    // Dispatch update to Redux store
    dispatch(updateUniverseParameters({
      universeId: universe.id,
      type: 'physics',
      parameters: updatedParams,
    }));

    // Send update through WebSocket
    websocketService.updateParameters(universe.id, 'physics', updatedParams);
  };

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h5" gutterBottom>
        Physics Parameters
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Adjust the physical properties of your universe to create unique behaviors and interactions.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <ParameterCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Basic Forces
              </Typography>
              <SliderContainer>
                <Typography gutterBottom>Gravity</Typography>
                <Slider
                  value={physicsParams.gravity}
                  onChange={handleParamChange('gravity')}
                  min={0}
                  max={20}
                  step={0.1}
                  marks={[
                    { value: 0, label: '0' },
                    { value: 9.81, label: 'Earth' },
                    { value: 20, label: '20' },
                  ]}
                  valueLabelDisplay="auto"
                />
              </SliderContainer>

              <SliderContainer>
                <Typography gutterBottom>Friction</Typography>
                <Slider
                  value={physicsParams.friction}
                  onChange={handleParamChange('friction')}
                  min={0}
                  max={1}
                  step={0.01}
                  marks={[
                    { value: 0, label: 'None' },
                    { value: 1, label: 'Max' },
                  ]}
                  valueLabelDisplay="auto"
                />
              </SliderContainer>

              <SliderContainer>
                <Typography gutterBottom>Elasticity</Typography>
                <Slider
                  value={physicsParams.elasticity}
                  onChange={handleParamChange('elasticity')}
                  min={0}
                  max={1}
                  step={0.01}
                  marks={[
                    { value: 0, label: 'None' },
                    { value: 1, label: 'Perfect' },
                  ]}
                  valueLabelDisplay="auto"
                />
              </SliderContainer>
            </CardContent>
          </ParameterCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <ParameterCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Advanced Settings
              </Typography>
              <SliderContainer>
                <Typography gutterBottom>Air Resistance</Typography>
                <Slider
                  value={physicsParams.airResistance}
                  onChange={handleParamChange('airResistance')}
                  min={0}
                  max={1}
                  step={0.01}
                  marks={[
                    { value: 0, label: 'None' },
                    { value: 1, label: 'High' },
                  ]}
                  valueLabelDisplay="auto"
                />
              </SliderContainer>

              <SliderContainer>
                <Typography gutterBottom>Particle Mass</Typography>
                <Slider
                  value={physicsParams.particleMass}
                  onChange={handleParamChange('particleMass')}
                  min={0.1}
                  max={10}
                  step={0.1}
                  marks={[
                    { value: 0.1, label: 'Light' },
                    { value: 10, label: 'Heavy' },
                  ]}
                  valueLabelDisplay="auto"
                />
              </SliderContainer>

              <SliderContainer>
                <Typography gutterBottom>Time Scale</Typography>
                <Slider
                  value={physicsParams.timeScale}
                  onChange={handleParamChange('timeScale')}
                  min={0.1}
                  max={2}
                  step={0.1}
                  marks={[
                    { value: 0.1, label: 'Slow' },
                    { value: 1, label: 'Normal' },
                    { value: 2, label: 'Fast' },
                  ]}
                  valueLabelDisplay="auto"
                />
              </SliderContainer>

              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography>Enable Collisions</Typography>
                <Switch
                  checked={physicsParams.collisionsEnabled}
                  onChange={(e) => handleParamChange('collisionsEnabled')(e, e.target.checked)}
                  color="primary"
                />
              </Box>
            </CardContent>
          </ParameterCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UniversePhysics;
