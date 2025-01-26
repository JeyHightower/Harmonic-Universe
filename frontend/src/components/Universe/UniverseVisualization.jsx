import {
    Box,
    Card,
    CardContent,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    SelectChangeEvent,
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

interface VisualParams {
  colorScheme: string;
  particleSize: number;
  trailLength: number;
  brightness: number;
  contrast: number;
  blurAmount: number;
  showGrid: boolean;
  gridSize: number;
  showAxes: boolean;
  backgroundColor: string;
}

interface UniverseVisualizationProps {
  universe: {
    id: number;
    visual_parameters: VisualParams;
  };
}

const COLOR_SCHEMES = [
  'Neon',
  'Pastel',
  'Monochrome',
  'Rainbow',
  'Ocean',
  'Forest',
  'Sunset',
  'Space',
];

const BACKGROUND_COLORS = [
  { name: 'Deep Space', value: '#0a0a1f' },
  { name: 'Midnight', value: '#1a1a2e' },
  { name: 'Dark Ocean', value: '#1a2b3c' },
  { name: 'Forest Night', value: '#1a2e1a' },
  { name: 'Cosmic Purple', value: '#2e1a2e' },
];

const UniverseVisualization: React.FC<UniverseVisualizationProps> = ({ universe }) => {
  const dispatch = useDispatch();
  const [visualParams, setVisualParams] = useState<VisualParams>({
    colorScheme: 'Neon',
    particleSize: 3,
    trailLength: 50,
    brightness: 0.8,
    contrast: 0.5,
    blurAmount: 0.2,
    showGrid: true,
    gridSize: 50,
    showAxes: true,
    backgroundColor: '#1a1a2e',
  });

  useEffect(() => {
    if (universe.visual_parameters) {
      setVisualParams(universe.visual_parameters);
    }
  }, [universe.visual_parameters]);

  const handleParamChange = (param: keyof VisualParams) => (
    event: Event | SelectChangeEvent,
    newValue?: number | string | boolean
  ) => {
    const value = newValue !== undefined ? newValue : (event as SelectChangeEvent).target.value;
    const updatedParams = {
      ...visualParams,
      [param]: value,
    };
    setVisualParams(updatedParams);

    // Dispatch update to Redux store
    dispatch(updateUniverseParameters({
      universeId: universe.id,
      type: 'visual',
      parameters: updatedParams,
    }));

    // Send update through WebSocket
    websocketService.updateParameters(universe.id, 'visual', updatedParams);
  };

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h5" gutterBottom>
        Visualization Parameters
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Customize the visual appearance of your universe to create stunning visual effects.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <ParameterCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Color & Style
              </Typography>
              <Box sx={{ mb: 3 }}>
                <FormControl fullWidth>
                  <InputLabel id="color-scheme-label">Color Scheme</InputLabel>
                  <Select
                    labelId="color-scheme-label"
                    value={visualParams.colorScheme}
                    label="Color Scheme"
                    onChange={(e) => handleParamChange('colorScheme')(e)}
                  >
                    {COLOR_SCHEMES.map((scheme) => (
                      <MenuItem key={scheme} value={scheme}>
                        {scheme}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ mb: 3 }}>
                <FormControl fullWidth>
                  <InputLabel id="background-color-label">Background</InputLabel>
                  <Select
                    labelId="background-color-label"
                    value={visualParams.backgroundColor}
                    label="Background"
                    onChange={(e) => handleParamChange('backgroundColor')(e)}
                  >
                    {BACKGROUND_COLORS.map((color) => (
                      <MenuItem key={color.value} value={color.value}>
                        {color.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <SliderContainer>
                <Typography gutterBottom>Brightness</Typography>
                <Slider
                  value={visualParams.brightness}
                  onChange={(e, value) => handleParamChange('brightness')(e, value as number)}
                  min={0}
                  max={1}
                  step={0.01}
                  marks={[
                    { value: 0, label: 'Dark' },
                    { value: 1, label: 'Bright' },
                  ]}
                  valueLabelDisplay="auto"
                />
              </SliderContainer>

              <SliderContainer>
                <Typography gutterBottom>Contrast</Typography>
                <Slider
                  value={visualParams.contrast}
                  onChange={(e, value) => handleParamChange('contrast')(e, value as number)}
                  min={0}
                  max={1}
                  step={0.01}
                  marks={[
                    { value: 0, label: 'Low' },
                    { value: 1, label: 'High' },
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
                Particles & Effects
              </Typography>
              <SliderContainer>
                <Typography gutterBottom>Particle Size</Typography>
                <Slider
                  value={visualParams.particleSize}
                  onChange={(e, value) => handleParamChange('particleSize')(e, value as number)}
                  min={1}
                  max={10}
                  step={0.5}
                  marks={[
                    { value: 1, label: 'Small' },
                    { value: 10, label: 'Large' },
                  ]}
                  valueLabelDisplay="auto"
                />
              </SliderContainer>

              <SliderContainer>
                <Typography gutterBottom>Trail Length</Typography>
                <Slider
                  value={visualParams.trailLength}
                  onChange={(e, value) => handleParamChange('trailLength')(e, value as number)}
                  min={0}
                  max={100}
                  step={1}
                  marks={[
                    { value: 0, label: 'None' },
                    { value: 100, label: 'Long' },
                  ]}
                  valueLabelDisplay="auto"
                />
              </SliderContainer>

              <SliderContainer>
                <Typography gutterBottom>Blur Amount</Typography>
                <Slider
                  value={visualParams.blurAmount}
                  onChange={(e, value) => handleParamChange('blurAmount')(e, value as number)}
                  min={0}
                  max={1}
                  step={0.01}
                  marks={[
                    { value: 0, label: 'Sharp' },
                    { value: 1, label: 'Soft' },
                  ]}
                  valueLabelDisplay="auto"
                />
              </SliderContainer>

              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Grid Settings
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography>Show Grid</Typography>
                  <Switch
                    checked={visualParams.showGrid}
                    onChange={(e) => handleParamChange('showGrid')(e, e.target.checked)}
                    color="primary"
                  />
                </Box>

                {visualParams.showGrid && (
                  <SliderContainer>
                    <Typography gutterBottom>Grid Size</Typography>
                    <Slider
                      value={visualParams.gridSize}
                      onChange={(e, value) => handleParamChange('gridSize')(e, value as number)}
                      min={20}
                      max={100}
                      step={5}
                      marks={[
                        { value: 20, label: 'Dense' },
                        { value: 100, label: 'Sparse' },
                      ]}
                      valueLabelDisplay="auto"
                    />
                  </SliderContainer>
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography>Show Axes</Typography>
                  <Switch
                    checked={visualParams.showAxes}
                    onChange={(e) => handleParamChange('showAxes')(e, e.target.checked)}
                    color="primary"
                  />
                </Box>
              </Box>
            </CardContent>
          </ParameterCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UniverseVisualization;
