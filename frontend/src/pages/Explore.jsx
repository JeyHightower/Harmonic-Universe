import {
    Favorite,
    FilterList as FilterIcon,
    MusicNote,
    Public,
    Science,
    Search as SearchIcon,
} from '@mui/icons-material';
import {
    Box,
    Chip,
    IconButton,
    InputAdornment,
    Tab,
    Tabs,
    TextField,
    Typography,
    useTheme,
} from '@mui/material';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import UniverseGrid from '../components/Universe/UniverseGrid';

const Explore = () => {
  const theme = useTheme();
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    physics: false,
    music: false,
    public: false,
    favorites: false,
  });

  const { universes, favorites, loading } = useSelector((state) => state.universe);
  const { user } = useSelector((state) => state.auth);

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
  };

  const handleFilterToggle = (filter) => {
    setFilters(prev => ({
      ...prev,
      [filter]: !prev[filter]
    }));
  };

  const filteredUniverses = universes?.filter(universe => {
    if (search && !universe.name.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (filters.physics && !universe.physics_enabled) return false;
    if (filters.music && !universe.music_enabled) return false;
    if (filters.public && !universe.is_public) return false;
    if (filters.favorites && !favorites?.includes(universe.id)) return false;

    switch (tab) {
      case 0: // All
        return true;
      case 1: // Popular
        return universe.favorite_count > 0;
      case 2: // Recent
        return true; // Sort by date
      case 3: // My Universes
        return universe.creator_id === user?.id;
      default:
        return true;
    }
  }).sort((a, b) => {
    switch (tab) {
      case 1: // Popular
        return b.favorite_count - a.favorite_count;
      case 2: // Recent
        return new Date(b.created_at) - new Date(a.created_at);
      default:
        return 0;
    }
  });

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Explore Universes
        </Typography>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search universes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  edge="end"
                  onClick={() => {}}
                  sx={{ color: 'action' }}
                >
                  <FilterIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            mb: 3,
            '& .MuiOutlinedInput-root': {
              backgroundColor: theme.palette.background.paper,
            },
          }}
        />

        <Box sx={{ mb: 3 }}>
          <Tabs
            value={tab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              mb: 2,
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': {
                minWidth: 100,
              },
            }}
          >
            <Tab label="All" />
            <Tab label="Popular" />
            <Tab label="Recent" />
            <Tab label="My Universes" />
          </Tabs>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              icon={<Science />}
              label="Physics"
              clickable
              color={filters.physics ? 'primary' : 'default'}
              onClick={() => handleFilterToggle('physics')}
            />
            <Chip
              icon={<MusicNote />}
              label="Music"
              clickable
              color={filters.music ? 'primary' : 'default'}
              onClick={() => handleFilterToggle('music')}
            />
            <Chip
              icon={<Public />}
              label="Public Only"
              clickable
              color={filters.public ? 'primary' : 'default'}
              onClick={() => handleFilterToggle('public')}
            />
            <Chip
              icon={<Favorite />}
              label="Favorites"
              clickable
              color={filters.favorites ? 'primary' : 'default'}
              onClick={() => handleFilterToggle('favorites')}
            />
          </Box>
        </Box>
      </Box>

      <UniverseGrid
        universes={filteredUniverses}
        loading={loading}
        favorites={favorites}
        currentUserId={user?.id}
      />
    </Box>
  );
};

export default Explore;
