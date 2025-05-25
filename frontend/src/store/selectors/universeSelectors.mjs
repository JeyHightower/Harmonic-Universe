/**
 * Universe Selectors
 *
 * This file provides selectors for accessing universe state in the Redux store.
 * Using memoized selectors improves performance by preventing unnecessary re-renders.
 */

import { createSelector } from '@reduxjs/toolkit';

// Basic selectors
export const selectUniversesState = (state) => state.universes;
export const selectAllUniverses = (state) => state.universes.universes;
export const selectCurrentUniverse = (state) => state.universes.currentUniverse;
export const selectUniverseLoading = (state) => state.universes.loading;
export const selectUniverseError = (state) => state.universes.error;
export const selectUniverseActionInProgress = (state) => state.universes.actionInProgress;

// Memoized selectors
export const selectUniverseById = createSelector(
  [selectAllUniverses, (_, universeId) => universeId],
  (universes, universeId) => universes.find((universe) => universe.id === universeId)
);

export const selectUniversesSortedByName = createSelector([selectAllUniverses], (universes) => {
  if (!universes) return [];
  return [...universes].sort((a, b) => a.name.localeCompare(b.name));
});

export const selectUniversesSortedByDate = createSelector([selectAllUniverses], (universes) => {
  if (!universes) return [];
  return [...universes].sort((a, b) => {
    const dateA = new Date(a.created_at || a.createdAt || 0);
    const dateB = new Date(b.created_at || b.createdAt || 0);
    return dateB - dateA; // newest first
  });
});

export const selectPublicUniverses = createSelector([selectAllUniverses], (universes) => {
  if (!universes) return [];
  return universes.filter((universe) => universe.is_public || universe.visibility === 'public');
});

export const selectPrivateUniverses = createSelector([selectAllUniverses], (universes) => {
  if (!universes) return [];
  return universes.filter((universe) => !universe.is_public && universe.visibility !== 'public');
});

export const selectUniversesCount = createSelector(
  [selectAllUniverses],
  (universes) => universes?.length || 0
);

export const selectUniverseIdsMap = createSelector([selectAllUniverses], (universes) => {
  const idMap = {};
  if (universes) {
    universes.forEach((universe) => {
      idMap[universe.id] = universe;
    });
  }
  return idMap;
});

// Helper selector to determine if a specific universe delete is in progress
export const selectIsUniverseBeingDeleted = createSelector(
  [selectUniversesState, (_, universeId) => universeId],
  (universeState, universeId) => {
    return (
      universeState.deletingUniverseIds && universeState.deletingUniverseIds.includes(universeId)
    );
  }
);

// Helper selector to get overall delete operation status
export const selectDeletingUniverseStatus = createSelector(
  [selectUniversesState],
  (universeState) => ({
    isDeleting: universeState.actionInProgress === 'delete',
    error: universeState.error,
    deletingIds: universeState.deletingUniverseIds || [],
  })
);
