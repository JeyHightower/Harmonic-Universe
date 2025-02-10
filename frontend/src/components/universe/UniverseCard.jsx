import { commonStyles } from '@/styles/commonStyles';
import {
    Delete as DeleteIcon,
    Edit as EditIcon,
    OpenInNew as OpenInNewIcon,
    Share as ShareIcon,
} from '@mui/icons-material';
import {
    Card,
    CardActions,
    CardContent,
    IconButton,
    Tooltip,
    Typography,
} from '@mui/material';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

const UniverseCard = ({ universe, onEdit, onDelete }) => {
  const navigate = useNavigate();

  return (
    <Card sx={{ ...commonStyles.card, ...commonStyles.slideIn }}>
      <CardContent sx={commonStyles.cardContent}>
        <Typography variant="h6" gutterBottom noWrap>
          {universe.name}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            mb: 1,
          }}
        >
          {universe.description}
        </Typography>
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end', p: 1 }}>
        <Tooltip title="Open Universe">
          <IconButton
            size="small"
            onClick={() => navigate(`/dashboard/universes/${universe.id}`)}
          >
            <OpenInNewIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Edit">
          <IconButton size="small" onClick={onEdit}>
            <EditIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Share">
          <IconButton size="small">
            <ShareIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton size="small" onClick={onDelete}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
};

UniverseCard.propTypes = {
  universe: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default UniverseCard;
