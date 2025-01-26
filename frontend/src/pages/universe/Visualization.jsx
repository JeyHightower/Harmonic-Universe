import {
    Box,
    Container,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Select,
    Slider,
    Switch,
    Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import WebSocketService from "../services/WebSocketService";
import { updateUniverseParameters } from "../store/slices/universeSlice";

const UniverseVisualization = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const universe = useSelector((state) => state.universes.current);
  const [visualParams, setVisualParams] = useState({
    colorScheme: "rainbow",
    particleSize: 5,
    trailLength: 50,
    brightness: 0.8,
    contrast: 1.0,
    blurAmount: 0.2,
    showGrid: true,
    gridSize: 50,
    showAxes: true,
    backgroundColor: "#000000",
  });

  useEffect(() => {
    if (universe?.parameters?.visual) {
      setVisualParams(universe.parameters.visual);
    }
  }, [universe]);

  const handleParamChange = (param) => (event, value) => {
    const newParams = { ...visualParams, [param]: value };
    setVisualParams(newParams);
    dispatch(
      updateUniverseParameters({ id, type: "visual", parameters: newParams }),
    );
  };

  useEffect(() => {
    const handleParameterUpdate = (data) => {
      if (data.universe_id === id && data.type === 'visual') {
        setVisualParams(data.parameters);
      }
    };

    WebSocketService.on('parameter_updated', handleParameterUpdate);

    return () => {
      WebSocketService.off('parameter_updated', handleParameterUpdate);
    };
  }, [id]);

  const colorSchemes = [
    "rainbow",
    "monochrome",
    "complementary",
    "analogous",
    "triadic",
    "custom",
  ];

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Visualization Parameters
        </Typography>

        <Box sx={{ my: 4 }}>
          <FormControl fullWidth>
            <InputLabel>Color Scheme</InputLabel>
            <Select
              value={visualParams.colorScheme}
              onChange={(e) =>
                handleParamChange("colorScheme")(e, e.target.value)
              }
            >
              {colorSchemes.map((scheme) => (
                <MenuItem key={scheme} value={scheme}>
                  {scheme.charAt(0).toUpperCase() + scheme.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ my: 4 }}>
          <Typography gutterBottom>Particle Size</Typography>
          <Slider
            value={visualParams.particleSize}
            onChange={handleParamChange("particleSize")}
            min={1}
            max={20}
            step={1}
            valueLabelDisplay="auto"
          />
        </Box>

        <Box sx={{ my: 4 }}>
          <Typography gutterBottom>Trail Length</Typography>
          <Slider
            value={visualParams.trailLength}
            onChange={handleParamChange("trailLength")}
            min={0}
            max={200}
            step={1}
            valueLabelDisplay="auto"
          />
        </Box>

        <Box sx={{ my: 4 }}>
          <Typography gutterBottom>Brightness</Typography>
          <Slider
            value={visualParams.brightness}
            onChange={handleParamChange("brightness")}
            min={0}
            max={2}
            step={0.1}
            valueLabelDisplay="auto"
          />
        </Box>

        <Box sx={{ my: 4 }}>
          <Typography gutterBottom>Contrast</Typography>
          <Slider
            value={visualParams.contrast}
            onChange={handleParamChange("contrast")}
            min={0}
            max={2}
            step={0.1}
            valueLabelDisplay="auto"
          />
        </Box>

        <Box sx={{ my: 4 }}>
          <Typography gutterBottom>Blur Amount</Typography>
          <Slider
            value={visualParams.blurAmount}
            onChange={handleParamChange("blurAmount")}
            min={0}
            max={1}
            step={0.1}
            valueLabelDisplay="auto"
          />
        </Box>

        <Box sx={{ my: 4 }}>
          <Typography gutterBottom>Grid Size</Typography>
          <Slider
            value={visualParams.gridSize}
            onChange={handleParamChange("gridSize")}
            min={10}
            max={100}
            step={5}
            valueLabelDisplay="auto"
            disabled={!visualParams.showGrid}
          />
        </Box>

        <Box sx={{ my: 4 }}>
          <FormControlLabel
            control={
              <Switch
                checked={visualParams.showGrid}
                onChange={(e) =>
                  handleParamChange("showGrid")(e, e.target.checked)
                }
              />
            }
            label="Show Grid"
          />
        </Box>

        <Box sx={{ my: 4 }}>
          <FormControlLabel
            control={
              <Switch
                checked={visualParams.showAxes}
                onChange={(e) =>
                  handleParamChange("showAxes")(e, e.target.checked)
                }
              />
            }
            label="Show Axes"
          />
        </Box>

        <Box sx={{ my: 4 }}>
          <FormControl fullWidth>
            <InputLabel>Background Color</InputLabel>
            <Select
              value={visualParams.backgroundColor}
              onChange={(e) =>
                handleParamChange("backgroundColor")(e, e.target.value)
              }
            >
              {["#000000", "#FFFFFF", "#1A1A1A", "#2C2C2C"].map((color) => (
                <MenuItem key={color} value={color}>
                  {color === "#000000"
                    ? "Black"
                    : color === "#FFFFFF"
                      ? "White"
                      : color === "#1A1A1A"
                        ? "Dark Gray"
                        : "Light Gray"}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>
    </Container>
  );
};

export default UniverseVisualization;
