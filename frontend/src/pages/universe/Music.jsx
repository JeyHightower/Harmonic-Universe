import { Box, Container, FormControl, InputLabel, MenuItem, Select, Slider, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { updateUniverseParameters } from '../store/slices/universeSlice';
import WebSocketService from '../services/WebSocketService';

const UniverseMusic = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const universe = useSelector(state => state.universes.current);
  const [musicParams, setMusicParams] = useState({
    tempo: 120,
    key: 'C',
    scale: 'major',
    harmony: 0.5
  });

  useEffect(() => {
    if (universe?.parameters?.music) {
      setMusicParams(universe.parameters.music);
    }
  }, [universe]);

  const handleParamChange = (param) => (event, value) => {
    const newParams = { ...musicParams, [param]: value };
    setMusicParams(newParams);
    dispatch(updateUniverseParameters({ id, type: 'music', parameters: newParams }));
  };

  useEffect(() => {
    const handleParameterUpdate = (data) => {
      if (data.universe_id === id && data.type === 'music') {
        setMusicParams(data.parameters);
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
          Music Parameters
        </Typography>

        <Box sx={{ my: 4 }}>
          <Typography gutterBottom>Tempo (BPM)</Typography>
          <Slider
            value={musicParams.tempo}
            onChange={handleParamChange('tempo')}
            min={60}
            max={200}
            valueLabelDisplay="auto"
          />
        </Box>

        <Box sx={{ my: 4 }}>
          <FormControl fullWidth>
            <InputLabel>Key</InputLabel>
            <Select
              value={musicParams.key}
              onChange={(e) => handleParamChange('key')(e, e.target.value)}
            >
              {['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'F', 'Bb', 'Eb', 'Ab', 'Db'].map(key => (
                <MenuItem key={key} value={key}>{key}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ my: 4 }}>
          <FormControl fullWidth>
            <InputLabel>Scale</InputLabel>
            <Select
              value={musicParams.scale}
              onChange={(e) => handleParamChange('scale')(e, e.target.value)}
            >
              {['major', 'minor', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'locrian'].map(scale => (
                <MenuItem key={scale} value={scale}>{scale}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ my: 4 }}>
          <Typography gutterBottom>Harmony</Typography>
          <Slider
            value={musicParams.harmony}
            onChange={handleParamChange('harmony')}
            min={0}
            max={1}
            step={0.1}
            valueLabelDisplay="auto"
          />
        </Box>
      </Box>
    </Container>
  );
};

export default UniverseMusic;

            >
              {[
                "major",
                "minor",
                "dorian",
                "phrygian",
                "lydian",
                "mixolydian",
                "locrian",
              ].map((scale) => (
                <MenuItem key={scale} value={scale}>
                  {scale}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ my: 4 }}>
          <Typography gutterBottom>Harmony</Typography>
          <Slider
            value={musicParams.harmony}
            onChange={handleParamChange("harmony")}
            min={0}
            max={1}
            step={0.1}
            valueLabelDisplay="auto"
          />
        </Box>
      </Box>
    </Container>
  );
};

export default UniverseMusic;
