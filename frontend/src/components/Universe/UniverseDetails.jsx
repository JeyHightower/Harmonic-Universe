import {
    Delete as DeleteIcon,
    Edit as EditIcon,
    Share as ShareIcon,
    StarBorder as StarBorderIcon,
    Star as StarIcon,
} from '@mui/icons-material';
import {
    Box,
    Card,
    CardContent,
    Container,
    IconButton,
    Tab,
    Tabs,
    Tooltip,
    Typography,
    alpha,
    styled
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { websocketService } from '../../services/websocketService';
import { deleteUniverse, fetchUniverse, toggleFavorite } from '../../store/slices/universeSlice';
import { RootState } from '../../store/store';
import UniverseMusic from './UniverseMusic';
import UniversePhysics from './UniversePhysics';
import UniverseVisualization from './UniverseVisualization';

const DetailsCard = styled(Card)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.background.paper, 0.6),
  backdropFilter: 'blur(8px)',
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = styled((props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`universe-tabpanel-${index}`}
      aria-labelledby={`universe-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
})(({ theme }) => ({
  padding: theme.spacing(3, 0),
}));

const UniverseDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const universe = useSelector((state: RootState) => state.universe.currentUniverse);
  const loading = useSelector((state: RootState) => state.universe.loading);
  const error = useSelector((state: RootState) => state.universe.error);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (id) {
      dispatch(fetchUniverse(parseInt(id, 10)));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (universe) {
      websocketService.connect();
      websocketService.joinUniverse(universe.id);

      return () => {
        websocketService.leaveUniverse(universe.id);
      };
    }
  }, [universe]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this universe?')) {
      try {
        await dispatch(deleteUniverse(parseInt(id!, 10)));
        navigate('/dashboard');
      } catch (error) {
        console.error('Failed to delete universe:', error);
      }
    }
  };

  const handleFavorite = async () => {
    try {
      await dispatch(toggleFavorite(parseInt(id!, 10)));
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 8, mb: 8 }}>
        <Typography>Loading universe...</Typography>
      </Container>
    );
  }

  if (error || !universe) {
    return (
      <Container maxWidth="lg" sx={{ mt: 8, mb: 8 }}>
        <Typography color="error">{error || 'Universe not found'}</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 8, mb: 8 }}>
      <DetailsCard>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                {universe.name}
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                {universe.description}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Last updated: {new Date(universe.updatedAt).toLocaleDateString()}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Edit Universe">
                <IconButton onClick={() => setTabValue(3)}>
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title={universe.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}>
                <IconButton
                  onClick={handleFavorite}
                  color={universe.isFavorite ? 'primary' : 'default'}
                >
                  {universe.isFavorite ? <StarIcon /> : <StarBorderIcon />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Share Universe">
                <IconButton>
                  <ShareIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete Universe">
                <IconButton color="error" onClick={handleDelete}>
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="universe settings tabs"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="Physics" />
              <Tab label="Music" />
              <Tab label="Visualization" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <UniversePhysics universe={universe} />
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <UniverseMusic universe={universe} />
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            <UniverseVisualization universe={universe} />
          </TabPanel>
        </CardContent>
      </DetailsCard>
    </Container>
  );
};

export default UniverseDetails;
