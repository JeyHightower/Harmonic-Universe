import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import {
  Box,
  Card,
  CardActions,
  CardContent,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { openModal } from '../../../store/slices/characterSlice';
import { deleteCharacter } from '../../../store/thunks/characterThunks';
import '../styles/Character.css';

const CharacterCard = ({ character }) => {
  const dispatch = useDispatch();

  const handleEdit = () => {
    dispatch(openModal('edit', character));
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this character?')) {
      dispatch(deleteCharacter(character.id));
    }
  };

  const handleView = () => {
    dispatch(openModal('view'));
  };

  return (
    <Card className="character-card">
      <CardContent>
        <Typography variant="h6" component="h3" className="character-card-title">
          {character.name}
        </Typography>
        <Typography variant="body2" color="textSecondary" className="character-card-description">
          {character.description || 'No description available'}
        </Typography>
      </CardContent>
      <CardActions className="character-card-actions">
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <Box>
            <IconButton size="small" onClick={handleView} title="View Details">
              <ViewIcon />
            </IconButton>
            <Tooltip title="Edit">
              <IconButton size="small" onClick={handleEdit} title="Edit Character">
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                size="small"
                onClick={handleDelete}
                title="Delete Character"
                color="error"
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
          <Typography variant="caption" color="text.secondary">
            Created: {new Date(character.created_at).toLocaleDateString()}
          </Typography>
        </Box>
      </CardActions>
    </Card>
  );
};

CharacterCard.propTypes = {
  character: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    created_at: PropTypes.string.isRequired,
  }).isRequired,
};

export default CharacterCard;
