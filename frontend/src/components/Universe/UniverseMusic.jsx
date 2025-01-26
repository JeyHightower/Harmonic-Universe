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

interface MusicParams {
  tempo: number;
  key: string;
  scale: string;
  harmony: number;
  volume: number;
  reverb: number;
  delay: number;
}

interface UniverseMusicProps {
  universe: {
    id: number;
    music_parameters: MusicParams;
  };
}

const MUSICAL_KEYS = [
  'C', 'G', 'D', 'A', 'E', 'B', 'F♯',
  'F', 'B♭', 'E♭', 'A♭', 'D♭', 'G♭',
];

const MUSICAL_SCALES = [
  'Major',
  'Natural Minor',
  'Harmonic Minor',
  'Melodic Minor',
  'Dorian',
  'Phrygian',
  'Lydian',
  'Mixolydian',
  'Locrian',
  'Pentatonic Major',
  'Pentatonic Minor',
  'Blues',
];

const UniverseMusic: React.FC<UniverseMusicProps> = ({ universe }) => {
  const dispatch = useDispatch();
  const [musicParams, setMusicParams] = useState<MusicParams>({
    tempo: 120,
    key: 'C',
    scale: 'Major',
    harmony: 0.5,
    volume: 0.8,
    reverb: 0.3,
    delay: 0.2,
  });

  useEffect(() => {
    if (universe.music_parameters) {
      setMusicParams(universe.music_parameters);
    }
  }, [universe.music_parameters]);

  const handleParamChange = (param: keyof MusicParams) => (
    event: Event | SelectChangeEvent,
    newValue?: number | string
  ) => {
    const value = newValue !== undefined ? newValue : (event as SelectChangeEvent).target.value;
    const updatedParams = {
      ...musicParams,
      [param]: value,
    };
    setMusicParams(updatedParams);

    // Dispatch update to Redux store
    dispatch(updateUniverseParameters({
      universeId: universe.id,
      type: 'music',
      parameters: updatedParams,
    }));

    // Send update through WebSocket
    websocketService.updateParameters(universe.id, 'music', updatedParams);
  };

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h5" gutterBottom>
        Music Parameters
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Shape the musical characteristics of your universe to create unique soundscapes.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <ParameterCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Musical Structure
              </Typography>
              <Box sx={{ mb: 3 }}>
                <FormControl fullWidth>
                  <InputLabel id="key-select-label">Key</InputLabel>
                  <Select
                    labelId="key-select-label"
                    value={musicParams.key}
                    label="Key"
                    onChange={(e) => handleParamChange('key')(e)}
                  >
                    {MUSICAL_KEYS.map((key) => (
                      <MenuItem key={key} value={key}>
                        {key}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ mb: 3 }}>
                <FormControl fullWidth>
                  <InputLabel id="scale-select-label">Scale</InputLabel>
                  <Select
                    labelId="scale-select-label"
                    value={musicParams.scale}
                    label="Scale"
                    onChange={(e) => handleParamChange('scale')(e)}
                  >
                    {MUSICAL_SCALES.map((scale) => (
                      <MenuItem key={scale} value={scale}>
                        {scale}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <SliderContainer>
                <Typography gutterBottom>Tempo (BPM)</Typography>
                <Slider
                  value={musicParams.tempo}
                  onChange={(e, value) => handleParamChange('tempo')(e, value as number)}
                  min={40}
                  max={200}
                  step={1}
                  marks={[
                    { value: 40, label: '40' },
                    { value: 120, label: '120' },
                    { value: 200, label: '200' },
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
                Sound Design
              </Typography>
              <SliderContainer>
                <Typography gutterBottom>Harmony</Typography>
                <Slider
                  value={musicParams.harmony}
                  onChange={(e, value) => handleParamChange('harmony')(e, value as number)}
                  min={0}
                  max={1}
                  step={0.01}
                  marks={[
                    { value: 0, label: 'Dissonant' },
                    { value: 1, label: 'Harmonic' },
                  ]}
                  valueLabelDisplay="auto"
                />
              </SliderContainer>

              <SliderContainer>
                <Typography gutterBottom>Volume</Typography>
                <Slider
                  value={musicParams.volume}
                  onChange={(e, value) => handleParamChange('volume')(e, value as number)}
                  min={0}
                  max={1}
                  step={0.01}
                  marks={[
                    { value: 0, label: 'Mute' },
                    { value: 1, label: 'Max' },
                  ]}
                  valueLabelDisplay="auto"
                />
              </SliderContainer>

              <SliderContainer>
                <Typography gutterBottom>Reverb</Typography>
                <Slider
                  value={musicParams.reverb}
                  onChange={(e, value) => handleParamChange('reverb')(e, value as number)}
                  min={0}
                  max={1}
                  step={0.01}
                  marks={[
                    { value: 0, label: 'Dry' },
                    { value: 1, label: 'Wet' },
                  ]}
                  valueLabelDisplay="auto"
                />
              </SliderContainer>

              <SliderContainer>
                <Typography gutterBottom>Delay</Typography>
                <Slider
                  value={musicParams.delay}
                  onChange={(e, value) => handleParamChange('delay')(e, value as number)}
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
            </CardContent>
          </ParameterCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UniverseMusic;
