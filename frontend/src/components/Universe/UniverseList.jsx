import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    FavoriteBorder as FavoriteBorderIcon,
    Favorite as FavoriteIcon,
    FilterList as FilterListIcon,
    Sort as SortIcon,
} from '@mui/icons-material';
import {
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    Container,
    Grid,
    IconButton,
    Menu,
    MenuItem,
    Tooltip,
    Typography,
    alpha,
    styled,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    deleteUniverse,
    fetchUniverses,
    toggleFavorite,
} from '../../store/slices/universeSlice';
import { RootState } from '../../store/store';

const UniverseCard = styled(Card)(({ theme }) => ({
  height: '100%',
  backgroundColor: alpha(theme.palette.background.paper, 0.6),
  backdropFilter: 'blur(8px)',
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

const ToolbarContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(3),
}));

interface Universe {
  id: number;
  name: string;
  description: string;
  isFavorite: boolean;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

const UniverseList: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const universes = useSelector((state: RootState) => state.universe.universes);
  const loading = useSelector((state: RootState) => state.universe.loading);
  const error = useSelector((state: RootState) => state.universe.error);

  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [sortBy, setSortBy] = useState<string>('updated');
  const [filterBy, setFilterBy] = useState<string>('all');

  useEffect(() => {
    dispatch(fetchUniverses());
  }, [dispatch]);

  const handleSortClick = (event: React.MouseEvent<HTMLElement>) => {
    setSortAnchorEl(event.currentTarget);
  };

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleSortClose = (value?: string) => {
    setSortAnchorEl(null);
    if (value) {
      setSortBy(value);
    }
  };

  const handleFilterClose = (value?: string) => {
    setFilterAnchorEl(null);
    if (value) {
      setFilterBy(value);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this universe?')) {
      try {
        await dispatch(deleteUniverse(id));
      } catch (error) {
        console.error('Failed to delete universe:', error);
      }
    }
  };

  const handleFavorite = async (id: number) => {
    try {
      await dispatch(toggleFavorite(id));
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const filteredAndSortedUniverses = [...universes]
    .filter((universe) => {
      switch (filterBy) {
        case 'favorites':
          return universe.isFavorite;
        case 'private':
          return universe.isPrivate;
        case 'public':
          return !universe.isPrivate;
        default:
          return true;
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'updated':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 8, mb: 8 }}>
        <Typography>Loading universes...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 8, mb: 8 }}>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 8, mb: 8 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Your Universes
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage and explore your created universes
        </Typography>
      </Box>

      <ToolbarContainer>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<SortIcon />}
            onClick={handleSortClick}
          >
            Sort
          </Button>
          <Menu
            anchorEl={sortAnchorEl}
            open={Boolean(sortAnchorEl)}
            onClose={() => handleSortClose()}
          >
            <MenuItem onClick={() => handleSortClose('name')}>By Name</MenuItem>
            <MenuItem onClick={() => handleSortClose('created')}>By Creation Date</MenuItem>
            <MenuItem onClick={() => handleSortClose('updated')}>By Last Updated</MenuItem>
          </Menu>

          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={handleFilterClick}
          >
            Filter
          </Button>
          <Menu
            anchorEl={filterAnchorEl}
            open={Boolean(filterAnchorEl)}
            onClose={() => handleFilterClose()}
          >
            <MenuItem onClick={() => handleFilterClose('all')}>All Universes</MenuItem>
            <MenuItem onClick={() => handleFilterClose('favorites')}>Favorites</MenuItem>
            <MenuItem onClick={() => handleFilterClose('private')}>Private</MenuItem>
            <MenuItem onClick={() => handleFilterClose('public')}>Public</MenuItem>
          </Menu>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/universe/create')}
        >
          Create Universe
        </Button>
      </ToolbarContainer>

      <Grid container spacing={3}>
        {filteredAndSortedUniverses.map((universe) => (
          <Grid item xs={12} sm={6} md={4} key={universe.id}>
            <UniverseCard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {universe.name}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    mb: 2,
                  }}
                >
                  {universe.description}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Last updated: {new Date(universe.updatedAt).toLocaleDateString()}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                <Box>
                  <Tooltip title="Edit Universe">
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/universe/${universe.id}`)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={universe.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}>
                    <IconButton
                      size="small"
                      onClick={() => handleFavorite(universe.id)}
                      color={universe.isFavorite ? 'primary' : 'default'}
                    >
                      {universe.isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                    </IconButton>
                  </Tooltip>
                </Box>
                <Tooltip title="Delete Universe">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(universe.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </CardActions>
            </UniverseCard>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default UniverseList;
