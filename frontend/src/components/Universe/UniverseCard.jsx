// UniverseCard.js
import {
    Delete,
    Edit,
    Favorite,
    FavoriteBorder,
    Lock,
    MusicNote,
    Public,
    Science,
    Share,
} from '@mui/icons-material';
import {
    Avatar,
    Box,
    Card,
    CardActions,
    CardContent,
    Chip,
    IconButton,
    Tooltip,
    Typography,
    useTheme,
} from '@mui/material';
import PropTypes from 'prop-types';
import React from 'react';

const UniverseCard = ({
  universe,
  onFavorite,
  onShare,
  onEdit,
  onDelete,
  isFavorite,
  isOwner,
}) => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'visible',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: theme.palette.primary.main,
          borderTopLeftRadius: theme.shape.borderRadius,
          borderTopRightRadius: theme.shape.borderRadius,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {universe.name}
          </Typography>
          {universe.is_public ? (
            <Tooltip title="Public">
              <Public fontSize="small" color="action" />
            </Tooltip>
          ) : (
            <Tooltip title="Private">
              <Lock fontSize="small" color="action" />
            </Tooltip>
          )}
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {universe.description}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          {universe.physics_enabled && (
            <Chip
              icon={<Science fontSize="small" />}
              label="Physics"
              size="small"
              variant="outlined"
              sx={{ borderColor: 'rgba(255,255,255,0.12)' }}
            />
          )}
          {universe.music_enabled && (
            <Chip
              icon={<MusicNote fontSize="small" />}
              label="Music"
              size="small"
              variant="outlined"
              sx={{ borderColor: 'rgba(255,255,255,0.12)' }}
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar
            src={universe.creator_avatar}
            alt={universe.creator_name}
            sx={{ width: 24, height: 24 }}
          />
          <Typography variant="body2" color="text.secondary">
            {universe.creator_name}
          </Typography>
        </Box>
      </CardContent>

      <CardActions sx={{ px: 2, py: 1, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
          <Box>
            <Tooltip title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
              <IconButton
                size="small"
                onClick={onFavorite}
                color={isFavorite ? 'primary' : 'default'}
              >
                {isFavorite ? <Favorite /> : <FavoriteBorder />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Share">
              <IconButton size="small" onClick={onShare}>
                <Share />
              </IconButton>
            </Tooltip>
          </Box>
          {isOwner && (
            <Box>
              <Tooltip title="Edit">
                <IconButton size="small" onClick={onEdit}>
                  <Edit />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton size="small" onClick={onDelete} color="error">
                  <Delete />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>
      </CardActions>
    </Card>
  );
};

UniverseCard.propTypes = {
  universe: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    gravity_constant: PropTypes.number,
    environment_harmony: PropTypes.number,
    created_at: PropTypes.string,
    favorite_count: PropTypes.number,
    is_public: PropTypes.bool,
    physics_enabled: PropTypes.bool,
    music_enabled: PropTypes.bool,
    creator_avatar: PropTypes.string,
    creator_name: PropTypes.string,
  }).isRequired,
  onFavorite: PropTypes.func.isRequired,
  onShare: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  isFavorite: PropTypes.bool.isRequired,
  isOwner: PropTypes.bool.isRequired,
};

export default UniverseCard;
