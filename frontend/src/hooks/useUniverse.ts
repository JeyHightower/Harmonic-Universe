import { showAlert, showConfirmDialog } from '@/store/slices/uiSlice';
import {
  clearFilters,
  createUniverse,
  deleteUniverse,
  fetchUniverseById,
  fetchUniverses,
  setFilterBy,
  setSearchQuery,
  setSortBy,
  toggleFavorite,
  updateUniverse,
} from '@/store/slices/universeSlice';
import { Universe } from '@/types/universe';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './useRedux';

export const useUniverse = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const {
    universes,
    currentUniverse,
    userUniverses,
    collaboratingUniverses,
    favoriteUniverses,
    isLoading,
    error,
    searchQuery,
    sortBy,
    filterBy,
  } = useAppSelector(state => state.universe);

  const handleFetchUniverses = useCallback(async () => {
    try {
      await dispatch(fetchUniverses()).unwrap();
    } catch (error) {
      // Error is handled by the universe slice
    }
  }, [dispatch]);

  const handleFetchUniverseById = useCallback(
    async (universeId: number) => {
      try {
        await dispatch(fetchUniverseById(universeId)).unwrap();
      } catch (error) {
        navigate('/404');
      }
    },
    [dispatch, navigate]
  );

  const handleCreateUniverse = useCallback(
    async (universeData: Partial<Universe>) => {
      try {
        const result = await dispatch(createUniverse(universeData)).unwrap();
        navigate(`/universes/${result.id}`);
        dispatch(
          showAlert({
            type: 'success',
            message: 'Universe created successfully!',
          })
        );
      } catch (error) {
        // Error is handled by the universe slice
      }
    },
    [dispatch, navigate]
  );

  const handleUpdateUniverse = useCallback(
    async (universeId: number, data: Partial<Universe>) => {
      try {
        await dispatch(updateUniverse({ id: universeId, data })).unwrap();
        dispatch(
          showAlert({
            type: 'success',
            message: 'Universe updated successfully!',
          })
        );
      } catch (error) {
        // Error is handled by the universe slice
      }
    },
    [dispatch]
  );

  const handleDeleteUniverse = useCallback(
    (universeId: number) => {
      dispatch(
        showConfirmDialog({
          title: 'Delete Universe',
          message:
            'Are you sure you want to delete this universe? This action cannot be undone.',
          confirmLabel: 'Delete',
          cancelLabel: 'Cancel',
          onConfirm: async () => {
            try {
              await dispatch(deleteUniverse(universeId)).unwrap();
              navigate('/profile');
              dispatch(
                showAlert({
                  type: 'success',
                  message: 'Universe deleted successfully!',
                })
              );
            } catch (error) {
              // Error is handled by the universe slice
            }
          },
        })
      );
    },
    [dispatch, navigate]
  );

  const handleToggleFavorite = useCallback(
    async (universeId: number, isFavorited: boolean) => {
      try {
        await dispatch(toggleFavorite({ universeId, isFavorited })).unwrap();
        dispatch(
          showAlert({
            type: 'success',
            message: isFavorited
              ? 'Universe removed from favorites!'
              : 'Universe added to favorites!',
          })
        );
      } catch (error) {
        // Error is handled by the universe slice
      }
    },
    [dispatch]
  );

  const handleSearch = useCallback(
    (query: string) => {
      dispatch(setSearchQuery(query));
    },
    [dispatch]
  );

  const handleSort = useCallback(
    (sortBy: 'recent' | 'popular' | 'name') => {
      dispatch(setSortBy(sortBy));
    },
    [dispatch]
  );

  const handleFilter = useCallback(
    (filters: { isPublic?: boolean | null; allowGuests?: boolean | null }) => {
      dispatch(setFilterBy(filters));
    },
    [dispatch]
  );

  const handleClearFilters = useCallback(() => {
    dispatch(clearFilters());
  }, [dispatch]);

  return {
    universes,
    currentUniverse,
    userUniverses,
    collaboratingUniverses,
    favoriteUniverses,
    isLoading,
    error,
    searchQuery,
    sortBy,
    filterBy,
    handleFetchUniverses,
    handleFetchUniverseById,
    handleCreateUniverse,
    handleUpdateUniverse,
    handleDeleteUniverse,
    handleToggleFavorite,
    handleSearch,
    handleSort,
    handleFilter,
    handleClearFilters,
  };
};

export default useUniverse;
