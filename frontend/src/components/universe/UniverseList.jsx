import { useModal } from '@/contexts/ModalContext';
import { useUniverse } from '@/hooks/useUniverse';
import { commonStyles } from '@/styles/commonStyles';
import { Add as AddIcon } from '@mui/icons-material';
import { Box, Button, Grid, Typography } from '@mui/material';
import { useEffect } from 'react';
import UniverseCard from './UniverseCard';

const UniverseList = () => {
  const { universes, fetchUniverses } = useUniverse();
  const { openModal } = useModal();

  useEffect(() => {
    fetchUniverses();
  }, [fetchUniverses]);

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
      </Grid>
    </Box>
  );
};

export default UniverseList;
