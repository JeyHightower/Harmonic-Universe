import Header from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import {
  createUniverse,
  deleteUniverse,
  fetchUniverses,
} from '@/store/slices/universeSlice';
import {
  LibraryMusic as AudioIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Public as UniverseIcon,
  Visibility as VisualizationIcon,
} from '@mui/icons-material';
import {
  Box,
  CircularProgress,
  Container,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const DRAWER_WIDTH = 240;

const menuItems = [
  { text: 'Universes', icon: <UniverseIcon />, path: '/dashboard/universes' },
  {
    text: 'Visualizations',
    icon: <VisualizationIcon />,
    path: '/dashboard/visualizations',
  },
  { text: 'Audio', icon: <AudioIcon />, path: '/dashboard/audio' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/dashboard/settings' },
  { text: 'Profile', icon: <PersonIcon />, path: '/dashboard/profile' },
];

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, token } = useAuth();
  const {
    universes,
    loading,
    error: globalError,
  } = useSelector(state => state.universe);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUniverse, setEditingUniverse] = useState(null);
  const [formError, setFormError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: false,
  });

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    if (!isAuthenticated || !token) {
      navigate('/login');
    }
  }, [isAuthenticated, token, navigate]);

  const handleOpenDialog = universe => {
    setFormError(null);
    if (universe) {
      setEditingUniverse(universe);
      setFormData({
        name: universe.name,
        description: universe.description,
        isPublic: universe.isPublic,
      });
    } else {
      setEditingUniverse(null);
      setFormData({
        name: '',
        description: '',
        isPublic: false,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUniverse(null);
    setFormError(null);
    setFormData({
      name: '',
      description: '',
      isPublic: false,
    });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setFormError(null);

    // Client-side validation
    const name = formData.name.trim();
    const description = formData.description?.trim() || '';

    if (!name) {
      setFormError('Name is required');
      return;
    }

    if (name.length > 255) {
      setFormError('Name must be less than 255 characters');
      return;
    }

    if (description.length > 1000) {
      setFormError('Description must be less than 1000 characters');
      return;
    }

    try {
      const universeData = {
        name,
        description,
        isPublic: Boolean(formData.isPublic),
      };

      console.log('Submitting universe data:', universeData);

      const resultAction = await dispatch(
        createUniverse(universeData)
      ).unwrap();

      if (resultAction) {
        handleCloseDialog();
        await dispatch(fetchUniverses()).unwrap();
      }
    } catch (err) {
      console.error('Failed to save universe:', err);

      // Handle login redirect
      if (typeof err === 'string' && err.includes('log in')) {
        navigate('/login');
        return;
      }

      // Display error message
      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        err;
      setFormError(errorMessage);

      // Log additional error details for debugging
      if (err.response) {
        console.error('Error Response:', {
          status: err.response.status,
          data: err.response.data,
          headers: err.response.headers,
        });
      }
    }
  };

  const handleDelete = async universeId => {
    if (window.confirm('Are you sure you want to delete this universe?')) {
      try {
        await dispatch(deleteUniverse(universeId)).unwrap();
      } catch (err) {
        console.error('Failed to delete universe:', err);
      }
    }
  };

  if (loading === 'pending') {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <Header onToggleSidebar={handleToggleSidebar} />

      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            mt: '64px', // Height of the header
          },
        }}
      >
        <List>
          {menuItems.map(item => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={location.pathname.startsWith(item.path)}
                onClick={() => navigate(item.path)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: '64px', // Height of the header
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
        }}
      >
        <Container maxWidth="xl">
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};

export default Dashboard;
