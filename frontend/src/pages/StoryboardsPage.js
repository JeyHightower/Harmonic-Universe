import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import StoryboardFilters from '../components/Storyboard/StoryboardFilters';
import StoryboardList from '../components/Storyboard/StoryboardList';
import StoryboardModal from '../components/Storyboard/StoryboardModal';
import StoryboardPagination from '../components/Storyboard/StoryboardPagination';
import {
  fetchStoryboards,
  setFilter,
  setPage,
  setSorting,
} from '../redux/slices/storyboardSlice';
import styles from './StoryboardsPage.module.css';

const StoryboardsPage = () => {
  const { universeId } = useParams();
  const dispatch = useDispatch();
  const { storyboards, pagination, sorting, filter, status, error } =
    useSelector(state => state.storyboard);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStoryboard, setSelectedStoryboard] = useState(null);

  useEffect(() => {
    loadStoryboards();
  }, [universeId, pagination.currentPage, sorting, filter]);

  const loadStoryboards = () => {
    dispatch(
      fetchStoryboards({
        universeId,
        page: pagination.currentPage,
        limit: pagination.limit,
        sort: sorting.field,
        order: sorting.order,
        filter,
      })
    );
  };

  const handlePageChange = page => {
    dispatch(setPage(page));
  };

  const handleSortChange = newSorting => {
    dispatch(setSorting(newSorting));
  };

  const handleFilterChange = newFilter => {
    dispatch(setFilter(newFilter));
    dispatch(setPage(1)); // Reset to first page when filter changes
  };

  const handleStoryboardClick = storyboard => {
    setSelectedStoryboard(storyboard);
    setIsModalOpen(true);
  };

  const handleCreateNew = () => {
    setSelectedStoryboard(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedStoryboard(null);
  };

  const handleModalSave = () => {
    setIsModalOpen(false);
    setSelectedStoryboard(null);
    loadStoryboards();
  };

  if (status === 'loading' && !storyboards.length) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loading}>Loading storyboards...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.error}>
          <h4>Error loading storyboards</h4>
          <p>{error}</p>
          <button onClick={loadStoryboards} className={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.storyboardsPage}>
      <div className={styles.header}>
        <h1>Storyboards</h1>
        <button onClick={handleCreateNew} className={styles.createButton}>
          Create New Storyboard
        </button>
      </div>

      <StoryboardFilters
        filter={filter}
        onFilterChange={handleFilterChange}
        sorting={sorting}
        onSortChange={handleSortChange}
      />

      <StoryboardList
        storyboards={storyboards}
        onStoryboardClick={handleStoryboardClick}
        isLoading={status === 'loading'}
      />

      <StoryboardPagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
      />

      <StoryboardModal
        isOpen={isModalOpen}
        storyboard={selectedStoryboard}
        onClose={handleModalClose}
        onSave={handleModalSave}
        universeId={universeId}
      />
    </div>
  );
};

export default StoryboardsPage;
