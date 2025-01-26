import {
    Box,
    Container,
    FormControlLabel,
    Slider,
    Switch,
    Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import WebSocketService from "../services/WebSocketService";
import { updateUniverseParameters } from "../store/slices/universeSlice";

const UniversePhysics = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const universe = useSelector((state) => state.universes.current);
  const [physicsParams, setPhysicsParams] = useState({
    gravity: 9.81,
    friction: 0.5,
    elasticity: 0.7,
    airResistance: 0.1,
    enableCollisions: true,
    particleMass: 1.0,
    timeScale: 1.0,
  });

  useEffect(() => {
    if (universe?.parameters?.physics) {
      setPhysicsParams(universe.parameters.physics);
    }
  }, [universe]);

  const handleParamChange = (param) => (event, value) => {
    const newParams = { ...physicsParams, [param]: value };
    setPhysicsParams(newParams);
    dispatch(
      updateUniverseParameters({ id, type: "physics", parameters: newParams }),
    );
  };

  useEffect(() => {
    const handleParameterUpdate = (data) => {
      if (data.universe_id === id && data.type === 'physics') {
        setPhysicsParams(data.parameters);
      }
    };

    WebSocketService.on('parameter_updated', handleParameterUpdate);

    return () => {
      WebSocketService.off('parameter_updated', handleParameterUpdate);
    };
  }, [id]);

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Physics Parameters
        </Typography>

        <Box sx={{ my: 4 }}>
          <Typography gutterBottom>Gravity (m/s²)</Typography>
          <Slider
            value={physicsParams.gravity}
            onChange={handleParamChange("gravity")}
            min={0}
            max={20}
            step={0.1}
            valueLabelDisplay="auto"
          />
        </Box>

        <Box sx={{ my: 4 }}>
          <Typography gutterBottom>Friction Coefficient</Typography>
          <Slider
            value={physicsParams.friction}
            onChange={handleParamChange("friction")}
            min={0}
            max={1}
            step={0.01}
            valueLabelDisplay="auto"
          />
        </Box>

        <Box sx={{ my: 4 }}>
          <Typography gutterBottom>Elasticity</Typography>
          <Slider
            value={physicsParams.elasticity}
            onChange={handleParamChange("elasticity")}
            min={0}
            max={1}
            step={0.01}
            valueLabelDisplay="auto"
          />
        </Box>

        <Box sx={{ my: 4 }}>
          <Typography gutterBottom>Air Resistance</Typography>
          <Slider
            value={physicsParams.airResistance}
            onChange={handleParamChange("airResistance")}
            min={0}
            max={1}
            step={0.01}
            valueLabelDisplay="auto"
          />
        </Box>

        <Box sx={{ my: 4 }}>
          <Typography gutterBottom>Particle Mass (kg)</Typography>
          <Slider
            value={physicsParams.particleMass}
            onChange={handleParamChange("particleMass")}
            min={0.1}
            max={10}
            step={0.1}
            valueLabelDisplay="auto"
          />
        </Box>

        <Box sx={{ my: 4 }}>
          <Typography gutterBottom>Time Scale</Typography>
          <Slider
            value={physicsParams.timeScale}
            onChange={handleParamChange("timeScale")}
            min={0.1}
            max={2}
            step={0.1}
            valueLabelDisplay="auto"
          />
        </Box>

        <Box sx={{ my: 4 }}>
          <FormControlLabel
            control={
              <Switch
                checked={physicsParams.enableCollisions}
                onChange={(e) =>
                  handleParamChange("enableCollisions")(e, e.target.checked)
                }
              />
            }
            label="Enable Collisions"
          />
        </Box>
      </Box>
    </Container>
  );
};

export default UniversePhysics;
