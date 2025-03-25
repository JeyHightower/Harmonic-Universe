import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, Typography, Box, Button, Tabs, Tab, 
  Paper, Grid, CircularProgress, Alert
} from '@mui/material';
import PhysicsEditor from '../components/PhysicsEditor';
import { API_URL } from '../config';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`scene-tabpanel-${index}`}
      aria-labelledby={`scene-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `scene-tab-${index}`,
    'aria-controls': `scene-tabpanel-${index}`,
  };
}

export default function SceneDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scene, setScene] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const fetchScene = async () => {
      try {
        const response = await fetch(`${API_URL}/api/scenes/${id}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch scene');
        }
        
        setScene(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchScene();
  }, [id]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!scene) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="warning">Scene not found</Alert>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          {scene.title}
        </Typography>
        <Button 
          variant="outlined" 
          onClick={() => navigate('/scenes')}
        >
          Back to Scenes
        </Button>
      </Box>
      
      <Paper sx={{ mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="scene tabs">
            <Tab label="Details" {...a11yProps(0)} />
            <Tab label="Characters" {...a11yProps(1)} />
            <Tab label="Physics" {...a11yProps(2)} />
            <Tab label="Music" {...a11yProps(3)} />
          </Tabs>
        </Box>
        
        {/* Details Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6">Description</Typography>
              <Typography paragraph>
                {scene.description || 'No description provided.'}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="h6">Universe</Typography>
              <Typography>
                {scene.universe?.name || 'Not assigned to a universe'}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="h6">Created</Typography>
              <Typography>
                {new Date(scene.created_at).toLocaleString()}
              </Typography>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Characters Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={2}>
            {scene.characters && scene.characters.length > 0 ? (
              scene.characters.map(character => (
                <Grid item xs={12} sm={6} md={4} key={character.id}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="h6">{character.name}</Typography>
                    <Button 
                      variant="text" 
                      size="small"
                      onClick={() => navigate(`/characters/${character.id}`)}
                    >
                      View Details
                    </Button>
                  </Paper>
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Typography>No characters in this scene yet.</Typography>
                <Button 
                  variant="contained" 
                  sx={{ mt: 1 }}
                  onClick={() => navigate(`/scenes/${id}/characters/add`)}
                >
                  Add Characters
                </Button>
              </Grid>
            )}
          </Grid>
        </TabPanel>
        
        {/* Physics Tab */}
        <TabPanel value={tabValue} index={2}>
          <PhysicsEditor entityType="scene" entityId={id} />
        </TabPanel>
        
        {/* Music Tab */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6">Music</Typography>
              {scene.music_piece ? (
                <Box>
                  <Typography variant="subtitle1">{scene.music_piece.title}</Typography>
                  <Typography variant="body2">{scene.music_piece.description}</Typography>
                  <Button 
                    variant="outlined" 
                    sx={{ mt: 1 }}
                    onClick={() => navigate(`/music/${scene.music_piece.id}`)}
                  >
                    View Music Details
                  </Button>
                </Box>
              ) : (
                <Box>
                  <Typography>No music attached to this scene.</Typography>
                  <Button 
                    variant="contained" 
                    sx={{ mt: 1 }}
                    onClick={() => navigate(`/scenes/${id}/music/assign`)}
                  >
                    Assign Music
                  </Button>
                </Box>
              )}
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
    </Container>
  );
} 