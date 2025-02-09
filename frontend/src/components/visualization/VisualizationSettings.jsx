import { useVisualization } from '@/hooks/useVisualization';
import PropTypes from 'prop-types';
import { useState } from 'react';

import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControlLabel,
  Grid,
  Switch,
  TextField,
  Typography,
} from '@mui/material';

const VisualizationSettings = ({ visualization }) => {
  const { update } = useVisualization();
  const [settings, setSettings] = useState(visualization.settings);

  const handleSettingChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    update(visualization.id, { settings: newSettings });
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Visualization Settings
        </Typography>
        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Width"
              type="number"
              value={settings.width}
              onChange={e => handleSettingChange('width', parseInt(e.target.value))}
              margin="normal"
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Height"
              type="number"
              value={settings.height}
              onChange={e => handleSettingChange('height', parseInt(e.target.value))}
              margin="normal"
            />
          </Grid>
        </Grid>

        <Box mt={2}>
          <TextField
            fullWidth
            label="Background Color"
            type="color"
            value={settings.backgroundColor}
            onChange={e => handleSettingChange('backgroundColor', e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Foreground Color"
            type="color"
            value={settings.foregroundColor}
            onChange={e => handleSettingChange('foregroundColor', e.target.value)}
            margin="normal"
          />
        </Box>

        <Box mt={2}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.showAxes}
                onChange={e => handleSettingChange('showAxes', e.target.checked)}
              />
            }
            label="Show Axes"
          />
          <FormControlLabel
            control={
              <Switch
                checked={settings.showGrid}
                onChange={e => handleSettingChange('showGrid', e.target.checked)}
              />
            }
            label="Show Grid"
          />
          <FormControlLabel
            control={
              <Switch
                checked={settings.showLabels}
                onChange={e => handleSettingChange('showLabels', e.target.checked)}
              />
            }
            label="Show Labels"
          />
        </Box>

        {visualization.type === 'custom' && settings.customSettings && (
          <Box mt={2}>
            <Typography variant="subtitle1" gutterBottom>
              Custom Settings
            </Typography>
            {Object.entries(settings.customSettings).map(([key, value]) => (
              <TextField
                key={key}
                fullWidth
                label={key}
                value={value}
                onChange={e =>
                  handleSettingChange('customSettings', {
                    ...settings.customSettings,
                    [key]: e.target.value,
                  })
                }
                margin="normal"
              />
            ))}
          </Box>
        )}

        <Box mt={3}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleSettingChange('settings', settings)}
            fullWidth
          >
            Save Settings
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

VisualizationSettings.propTypes = {
  visualization: PropTypes.shape({
    id: PropTypes.string.isRequired,
    settings: PropTypes.object.isRequired,
  }).isRequired,
};

export default VisualizationSettings;
