import {
  Edit as EditIcon,
  Favorite as FavoriteIcon,
} from '@mui/icons-material';
import {
  Box,
  Card,
  CardActions,
  CardContent,
  Container,
  Grid,
  IconButton,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { universeService } from '../../services/universeService';

const FavoritesList = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const data = await universeService.getUniverses({
          filter: 'favorites',
        });
        setFavorites(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  const handleRemoveFavorite = async id => {
    try {
      await universeService.toggleFavorite(id);
      setFavorites(favorites.filter(universe => universe.id !== id));
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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Favorite Universes
          <Typography component="span" color="text.secondary" sx={{ ml: 1 }}>
            ({favorites.length})
          </Typography>
        </Typography>
      </Box>

      {favorites.length === 0 ? (
        <Typography color="text.secondary">
          You haven't favorited any universes yet.
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {favorites.map(universe => (
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
                    Added to favorites:{' '}
                    {new Date(universe.favorited_at).toLocaleDateString()}
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
                    onClick={() => handleRemoveFavorite(universe.id)}
                    aria-label="remove from favorites"
                    color="error"
                  >
                    <FavoriteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default FavoritesList;
