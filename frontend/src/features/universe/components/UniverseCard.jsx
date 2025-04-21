import { Delete, Edit, NoteAlt, PersonOutline, Visibility } from '@mui/icons-material';
import { Box, Button, Card, CardActions, CardContent, CardMedia, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import defaultUniverseImage from '../../../assets/images/default-universe.svg';
import '../styles/UniverseCard.css';

const UniverseCard = ({ universe, isNew = false, onEdit, onDelete, onView }) => {
  const navigate = useNavigate();

  const handleViewScenes = () => {
    navigate(`/universes/${universe.id}`, { state: { activeTab: 'scenes' } });
  };

  const handleViewCharacters = () => {
    navigate(`/universes/${universe.id}`, { state: { activeTab: 'characters' } });
  };

  const handleViewNotes = () => {
    navigate(`/universes/${universe.id}`, { state: { activeTab: 'notes' } });
  };

  return (
    <Card className="universe-card" elevation={3}>
      <CardMedia
        component="img"
        height="140"
        image={universe.image_url || defaultUniverseImage}
        alt={universe.name}
        className="universe-card-media"
      />
      <CardContent className="universe-card-content">
        <Typography variant="h5" component="div" className="universe-card-title">
          {universe.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" className="universe-card-description">
          {universe.description?.length > 100
            ? `${universe.description.substring(0, 100)}...`
            : universe.description}
        </Typography>
      </CardContent>
      <CardActions className="universe-card-actions">
        <Box className="universe-card-action-buttons">
          <Button
            size="small"
            startIcon={<Visibility />}
            onClick={onView}
            className="universe-card-button"
          >
            View
          </Button>
          <Button
            size="small"
            startIcon={<Edit />}
            onClick={onEdit}
            className="universe-card-button"
          >
            Edit
          </Button>
          <Button
            size="small"
            color="error"
            startIcon={<Delete />}
            onClick={onDelete}
            className="universe-card-button"
          >
            Delete
          </Button>
        </Box>
        <Box className="universe-card-feature-buttons">
          <Button size="small" onClick={handleViewScenes} className="universe-card-feature-button">
            Scenes
          </Button>
          <Button
            size="small"
            startIcon={<PersonOutline />}
            onClick={handleViewCharacters}
            className="universe-card-feature-button"
          >
            Characters
          </Button>
          <Button
            size="small"
            startIcon={<NoteAlt />}
            onClick={handleViewNotes}
            className="universe-card-feature-button"
          >
            Notes
          </Button>
        </Box>
      </CardActions>
    </Card>
  );
};

UniverseCard.propTypes = {
  universe: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    image_url: PropTypes.string,
    is_public: PropTypes.bool,
    created_at: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    theme: PropTypes.string,
    genre: PropTypes.string,
  }).isRequired,
  isNew: PropTypes.bool,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onView: PropTypes.func,
};

export default UniverseCard;
