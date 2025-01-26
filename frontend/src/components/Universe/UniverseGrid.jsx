import { Box, CircularProgress, Grid, Typography } from "@mui/material";
import React from "react";
import UniverseCard from "./UniverseCard";

const UniverseGrid = ({
  universes,
  loading,
  error,
  onFavorite,
  onShare,
  onEdit,
  onDelete,
  favorites,
  currentUserId,
}) => {
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 400,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 400,
        }}
      >
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!universes?.length) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 400,
        }}
      >
        <Typography color="text.secondary">No universes found</Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {universes.map((universe) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={universe.id}>
          <UniverseCard
            universe={universe}
            onFavorite={() => onFavorite(universe.id)}
            onShare={() => onShare(universe.id)}
            onEdit={() => onEdit(universe.id)}
            onDelete={() => onDelete(universe.id)}
            isFavorite={favorites?.includes(universe.id)}
            isOwner={universe.creator_id === currentUserId}
          />
        </Grid>
      ))}
    </Grid>
  );
};

export default UniverseGrid;
