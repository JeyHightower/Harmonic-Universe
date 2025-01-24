import useAuth from '@/hooks/useAuth';
import useUniverse from '@/hooks/useUniverse';
import { Universe } from '@/types/universe';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import GroupIcon from '@mui/icons-material/Group';
import ShareIcon from '@mui/icons-material/Share';
import {
  Avatar,
  Box,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CardHeader,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface UniverseCardProps {
  universe: Universe;
}

const UniverseCard: React.FC<UniverseCardProps> = ({ universe }) => {
  const navigate = useNavigate();
  const { requireAuth } = useAuth();
  const { handleToggleFavorite } = useUniverse();

  const handleCardClick = () => {
    navigate(`/universe/${universe.id}`);
  };

  const handleFavorite = (event: React.MouseEvent) => {
    event.stopPropagation();
    requireAuth(() => {
      handleToggleFavorite(universe.id, universe.is_favorited);
    });
  };

  const handleShare = (event: React.MouseEvent) => {
    event.stopPropagation();
    // TODO: Implement share functionality
  };

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
        },
      }}
    >
      <CardActionArea onClick={handleCardClick}>
        <CardHeader
          avatar={
            <Avatar
              alt={universe.creator?.username}
              src={universe.creator?.avatar}
              sx={{ bgcolor: 'primary.main' }}
            >
              {universe.creator?.username?.[0]?.toUpperCase()}
            </Avatar>
          }
          title={universe.creator?.username}
          subheader={format(new Date(universe.created_at), 'MMM d, yyyy')}
        />
        <CardContent sx={{ flexGrow: 1, pb: 1 }}>
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
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {universe.description}
          </Typography>
        </CardContent>
      </CardActionArea>

      <CardActions
        disableSpacing
        sx={{
          justifyContent: 'space-between',
          px: 2,
          pb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title={universe.is_public ? 'Public' : 'Private'}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                color: 'text.secondary',
                mr: 2,
              }}
            >
              <GroupIcon
                fontSize="small"
                color={universe.is_public ? 'primary' : 'disabled'}
              />
              <Typography variant="body2" sx={{ ml: 0.5 }}>
                {universe.collaborators_count}
              </Typography>
            </Box>
          </Tooltip>
        </Box>

        <Box>
          <IconButton
            onClick={handleFavorite}
            color={universe.is_favorited ? 'error' : 'default'}
            size="small"
          >
            {universe.is_favorited ? (
              <FavoriteIcon fontSize="small" />
            ) : (
              <FavoriteBorderIcon fontSize="small" />
            )}
          </IconButton>
          <IconButton onClick={handleShare} size="small">
            <ShareIcon fontSize="small" />
          </IconButton>
        </Box>
      </CardActions>
    </Card>
  );
};

export default UniverseCard;
