import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Favorite as FavoriteIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Container,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Toolbar,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { universeService } from '../../services/universeService';

const UniverseList = () => {
  const navigate = useNavigate();
  const [universes, setUniverses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'favorites', 'my'
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'name'

  useEffect(() => {
    fetchUniverses();
  }, [filter, sortBy]);

  const fetchUniverses = async () => {
    try {
      const data = await universeService.getUniverses({ filter, sortBy });
      setUniverses(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleDelete = async id => {
    try {
      await universeService.deleteUniverse(id);
      setUniverses(universes.filter(universe => universe.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = id => {
    navigate(`/universes/${id}/edit`);
  };

  const handleView = id => {
    navigate(`/universes/${id}`);
  };

  const handleCreate = () => {
    navigate('/universes/new');
  };

  const handleToggleFavorite = async id => {
    try {
      const universe = universes.find(u => u.id === id);
      if (universe) {
        const updatedUniverse = await universeService.toggleFavorite(id);
        setUniverses(
          universes.map(u =>
            u.id === id ? { ...u, isFavorite: updatedUniverse.isFavorite } : u
          )
        );
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleFilterChange = event => {
    setFilter(event.target.value);
  };

  const handleSortChange = event => {
    setSortBy(event.target.value);
  };

  const getFavoriteCount = () => {
    return universes.filter(u => u.isFavorite).length;
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h4" component="h1">
            Your Universes
            {filter === 'favorites' && (
              <Typography
                component="span"
                color="text.secondary"
                sx={{ ml: 1 }}
              >
                ({getFavoriteCount()} favorites)
              </Typography>
            )}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
          >
            Create Universe
          </Button>
        </Box>

        <Toolbar sx={{ gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Filter</InputLabel>
            <Select value={filter} onChange={handleFilterChange} label="Filter">
              <MenuItem value="all">All Universes</MenuItem>
              <MenuItem value="favorites">Favorites</MenuItem>
              <MenuItem value="my">My Universes</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Sort By</InputLabel>
            <Select value={sortBy} onChange={handleSortChange} label="Sort By">
              <MenuItem value="newest">Newest First</MenuItem>
              <MenuItem value="oldest">Oldest First</MenuItem>
              <MenuItem value="name">Name</MenuItem>
            </Select>
          </FormControl>
        </Toolbar>
      </Box>

      <Grid container spacing={3}>
        {universes.map(universe => (
          <Grid item xs={12} sm={6} md={4} key={universe.id}>
            <Card>
              <CardContent
                sx={{ cursor: 'pointer' }}
                onClick={() => handleView(universe.id)}
              >
                <Typography variant="h6" component="h2" gutterBottom>
                  {universe.name}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {universe.description}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  Created: {new Date(universe.created_at).toLocaleDateString()}
                </Typography>
              </CardContent>
              <CardActions>
                <IconButton
                  size="small"
                  onClick={() => handleEdit(universe.id)}
                  aria-label="edit"
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleDelete(universe.id)}
                  aria-label="delete"
                >
                  <DeleteIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleToggleFavorite(universe.id)}
                  aria-label="favorite"
                >
                  {universe.isFavorite ? (
                    <FavoriteIcon color="error" />
                  ) : (
                    <FavoriteBorderIcon />
                  )}
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default UniverseList;
