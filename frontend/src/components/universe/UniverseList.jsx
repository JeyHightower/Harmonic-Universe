import { useModal } from '@/contexts/ModalContext';
import { useUniverse } from '@/hooks/useUniverse';
import { commonStyles } from '@/styles/commonStyles';
import { Add as AddIcon } from '@mui/icons-material';
import { Box, Button, CircularProgress, Grid, Typography } from '@mui/material';
import { useEffect, useRef } from 'react';
import UniverseCard from './UniverseCard';

const UniverseList = () => {
  const { universes, loading, error, fetchUniverses } = useUniverse();
  const { openModal } = useModal();
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Only fetch if we haven't fetched before and don't have any universes
        if (!hasFetchedRef.current && !universes.length) {
          await fetchUniverses();
          hasFetchedRef.current = true;
        }
      } catch (error) {
        console.error('Error fetching universes:', error);
      }
    };

    fetchData();

    return () => {
      // Reset the fetch flag when component unmounts
      hasFetchedRef.current = false;
    };
  }, [fetchUniverses, universes.length]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error" gutterBottom>
          {error}
        </Typography>
        <Button
          variant="contained"
          onClick={() => {
            hasFetchedRef.current = false;
            fetchUniverses();
          }}
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={commonStyles.pageContainer}>
      <Box sx={{ ...commonStyles.flexBetween, mb: 4 }}>
        <Typography variant="h4" component="h1">
          Your Universes
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => openModal('CREATE_UNIVERSE')}
          sx={commonStyles.button}
        >
          Create Universe
        </Button>
      </Box>

      <Grid container spacing={3} sx={commonStyles.fadeIn}>
        {universes.map(universe => (
          <Grid item xs={12} sm={6} md={4} key={universe.id}>
            <UniverseCard
              universe={universe}
              onEdit={() => openModal('EDIT_UNIVERSE', { universe })}
              onDelete={() => openModal('DELETE_UNIVERSE', { universe })}
            />
          </Grid>
        ))}
        {universes.length === 0 && (
          <Grid item xs={12}>
            <Typography variant="body1" color="textSecondary" align="center">
              No universes found. Create one to get started!
            </Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default UniverseList;
