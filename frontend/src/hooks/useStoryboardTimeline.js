import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchStoryboards,
  setFilters,
  setPagination,
  setSort,
} from '../redux/slices/storyboardSlice';
import { storage, STORAGE_DEFAULTS } from '../utils/storage';

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 10;
const DEFAULT_SORT_BY = 'created_at';
const DEFAULT_ORDER = 'desc';

export const useStoryboardTimeline = universeId => {
  const dispatch = useDispatch();
  const { storyboards, pagination, sort, filters, isLoading, error } =
    useSelector(state => state.storyboard);

  // Ref to track initial mount
  const isInitialMount = useRef(true);

  // Load saved preferences on mount
  useEffect(() => {
    if (isInitialMount.current) {
      const savedPreferences = storage.getStoryboardPreferences(universeId);
      if (savedPreferences) {
        dispatch(
          setPagination({ ...pagination, ...savedPreferences.pagination })
        );
        dispatch(setSort(savedPreferences.sort));
        dispatch(setFilters(savedPreferences.filters));
      }
      isInitialMount.current = false;
    }
  }, [universeId, dispatch, pagination]);

  // Save preferences when they change
  const savePreferences = useCallback(() => {
    storage.setStoryboardPreferences(universeId, {
      pagination: {
        perPage: pagination.perPage,
      },
      sort,
      filters,
    });
  }, [universeId, pagination.perPage, sort, filters]);

  useEffect(() => {
    if (!isInitialMount.current) {
      savePreferences();
    }
  }, [pagination.perPage, sort, filters, savePreferences]);

  // Load storyboards when parameters change
  const loadStoryboards = useCallback(async () => {
    const queryParams = new URLSearchParams({
      page: pagination.page,
      per_page: pagination.perPage,
      sort_by: sort.field,
      order: sort.order,
      ...(filters.search && { search: filters.search }),
      ...(filters.harmonyMin !== null && { harmony_min: filters.harmonyMin }),
      ...(filters.harmonyMax !== null && { harmony_max: filters.harmonyMax }),
    });

    await dispatch(fetchStoryboards(universeId, queryParams.toString()));
  }, [
    dispatch,
    universeId,
    pagination.page,
    pagination.perPage,
    sort.field,
    sort.order,
    filters,
  ]);

  useEffect(() => {
    loadStoryboards();
  }, [loadStoryboards]);

  // Pagination handlers
  const nextPage = useCallback(() => {
    if (pagination.page < pagination.totalPages) {
      dispatch(setPagination({ ...pagination, page: pagination.page + 1 }));
    }
  }, [pagination, dispatch]);

  const prevPage = useCallback(() => {
    if (pagination.page > 1) {
      dispatch(setPagination({ ...pagination, page: pagination.page - 1 }));
    }
  }, [pagination, dispatch]);

  const goToPage = useCallback(
    pageNum => {
      if (pageNum >= 1 && pageNum <= pagination.totalPages) {
        dispatch(setPagination({ ...pagination, page: pageNum }));
      }
    },
    [pagination, dispatch]
  );

  const changePerPage = useCallback(
    newPerPage => {
      dispatch(
        setPagination({
          ...pagination,
          perPage: newPerPage,
          page: 1,
        })
      );
    },
    [pagination, dispatch]
  );

  // Sorting handlers
  const updateSort = useCallback(
    newSortBy => {
      const newOrder =
        newSortBy === sort.field
          ? sort.order === 'asc'
            ? 'desc'
            : 'asc'
          : DEFAULT_ORDER;

      dispatch(
        setSort({
          field: newSortBy,
          order: newOrder,
        })
      );
      dispatch(setPagination({ ...pagination, page: 1 }));
    },
    [sort, pagination, dispatch]
  );

  // Search handler
  const updateSearch = useCallback(
    searchQuery => {
      dispatch(
        setFilters({
          ...filters,
          search: searchQuery,
        })
      );
      dispatch(setPagination({ ...pagination, page: 1 }));
    },
    [filters, pagination, dispatch]
  );

  // Filtering handlers
  const updateHarmonyRange = useCallback(
    (min, max) => {
      dispatch(
        setFilters({
          ...filters,
          harmonyMin: min,
          harmonyMax: max,
        })
      );
      dispatch(setPagination({ ...pagination, page: 1 }));
    },
    [filters, pagination, dispatch]
  );

  // Reset all filters and sorting
  const resetFilters = useCallback(() => {
    const defaultPreferences = STORAGE_DEFAULTS.storyboardPreferences;
    dispatch(setFilters(defaultPreferences.filters));
    dispatch(setSort(defaultPreferences.sort));
    dispatch(
      setPagination({
        ...pagination,
        page: DEFAULT_PAGE,
        perPage: defaultPreferences.pagination.perPage,
      })
    );
  }, [pagination, dispatch]);

  return {
    // State
    storyboards,
    isLoading,
    error,
    page: pagination.page,
    perPage: pagination.perPage,
    totalPages: pagination.totalPages,
    totalCount: pagination.totalCount,
    sortBy: sort.field,
    order: sort.order,
    search: filters.search,
    harmonyRange: {
      min: filters.harmonyMin,
      max: filters.harmonyMax,
    },

    // Handlers
    nextPage,
    prevPage,
    goToPage,
    changePerPage,
    updateSort,
    updateSearch,
    updateHarmonyRange,
    resetFilters,
    refresh: loadStoryboards,
  };
};
