import { Universe } from '@/types/universe';
import { Box, Grid, Skeleton } from '@mui/material';
import React from 'react';
import UniverseCard from './UniverseCard';

interface UniverseListProps {
  universes: Universe[];
  loading?: boolean;
}

const UniverseList: React.FC<UniverseListProps> = ({
  universes,
  loading = false,
}) => {
  const LoadingSkeleton = () => (
    <>
      {[1, 2, 3, 4, 5, 6].map(index => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Box sx={{ p: 1 }}>
            <Skeleton
              variant="rectangular"
              width="100%"
              height={200}
              sx={{ borderRadius: 2 }}
            />
            <Box sx={{ pt: 1 }}>
              <Skeleton width="60%" height={24} />
              <Skeleton width="40%" height={20} />
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Skeleton width={80} height={32} />
                <Skeleton width={80} height={32} />
              </Box>
            </Box>
          </Box>
        </Grid>
      ))}
    </>
  );

  if (loading) {
    return (
      <Grid container spacing={2}>
        <LoadingSkeleton />
      </Grid>
    );
  }

  if (!universes.length) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 200,
          bgcolor: 'background.paper',
          borderRadius: 2,
          p: 3,
        }}
      >
        No universes found
      </Box>
    );
  }

  return (
    <Grid container spacing={2}>
      {universes.map(universe => (
        <Grid item xs={12} sm={6} md={4} key={universe.id}>
          <UniverseCard universe={universe} />
        </Grid>
      ))}
    </Grid>
  );
};

export default UniverseList;
