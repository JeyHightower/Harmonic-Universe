import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CollaborationProvider } from '../../contexts/CollaborationContext';
import { useStoryboardForm } from '../../hooks/useStoryboardForm';
import { useStoryboardTimeline } from '../../hooks/useStoryboardTimeline';
import { deleteStoryboard } from '../../redux/slices/storyboardSlice';
import commonStyles from '../../styles/common.module.css';
import { calculateHarmonyColor } from '../../utils/colorUtils';
import { useDebounce } from '../../utils/debounceUtils';
import { createShortcutHandler } from '../../utils/keyboardUtils';
import { createSelector } from '../../utils/memoUtils';
import {
  addToHistory,
  createVersion,
  getVersionDiff,
} from '../../utils/versionUtils';
import BatchOperations from '../BatchOperations/BatchOperations';
import Comments from '../Comments/Comments';
import Presence from '../Presence/Presence';
import RichTextEditor from '../RichTextEditor/RichTextEditor';
import VirtualList from '../VirtualList/VirtualList';
import styles from './Storyboard.module.css';
import TimelineVisualization from './TimelineVisualization';

// Memoized Components
const TimelineItem = React.memo(
  ({ storyboard, onEdit, onDelete, isSelected }) => {
    const backgroundColor = useMemo(
      () => calculateHarmonyColor(storyboard.harmony_tie),
      [storyboard.harmony_tie]
    );

    const handleEdit = useCallback(
      () => onEdit(storyboard),
      [onEdit, storyboard]
    );
    const handleDelete = useCallback(
      () => onDelete(storyboard.id),
      [onDelete, storyboard.id]
    );

    return (
      <div
        className={`${styles.timelineItem} ${
          isSelected ? styles.selected : ''
        }`}
      >
        <div className={styles.harmonyIndicator} style={{ backgroundColor }} />
        <div className={styles.timelineContent}>
          <h4>{storyboard.plot_point}</h4>
          <div
            className={styles.description}
            dangerouslySetInnerHTML={{ __html: storyboard.description }}
          />
          <div className={styles.timelineActions}>
            <button className={commonStyles.primaryButton} onClick={handleEdit}>
              Edit
            </button>
            <button
              className={commonStyles.dangerButton}
              onClick={handleDelete}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  }
);

const TimelineControls = React.memo(
  ({
    sortBy,
    order,
    updateSort,
    search,
    updateSearch,
    harmonyRange,
    updateHarmonyRange,
    resetFilters,
  }) => {
    const handleSearchChange = useCallback(
      e => updateSearch(e.target.value),
      [updateSearch]
    );

    const handleSortByDate = useCallback(
      () => updateSort('created_at'),
      [updateSort]
    );

    const handleSortByHarmony = useCallback(
      () => updateSort('harmony_tie'),
      [updateSort]
    );

    const handleMinHarmonyChange = useCallback(
      e => updateHarmonyRange(parseFloat(e.target.value), harmonyRange.max),
      [updateHarmonyRange, harmonyRange.max]
    );

    const handleMaxHarmonyChange = useCallback(
      e => updateHarmonyRange(harmonyRange.min, parseFloat(e.target.value)),
      [updateHarmonyRange, harmonyRange.min]
    );

    return (
      <div className={styles.timelineControls}>
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Search plot points..."
            value={search}
            onChange={handleSearchChange}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.sortControls}>
          <button
            className={`${styles.sortButton} ${
              sortBy === 'created_at' ? styles.active : ''
            }`}
            onClick={handleSortByDate}
          >
            Date {sortBy === 'created_at' && (order === 'asc' ? '↑' : '↓')}
          </button>
          <button
            className={`${styles.sortButton} ${
              sortBy === 'harmony_tie' ? styles.active : ''
            }`}
            onClick={handleSortByHarmony}
          >
            Harmony {sortBy === 'harmony_tie' && (order === 'asc' ? '↑' : '↓')}
          </button>
        </div>
        <div className={styles.filterControls}>
          <div className={styles.harmonyFilter}>
            <label>Harmony Range:</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={harmonyRange.min || 0}
              onChange={handleMinHarmonyChange}
            />
            <span>Min: {harmonyRange.min || 0}</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={harmonyRange.max || 1}
              onChange={handleMaxHarmonyChange}
            />
            <span>Max: {harmonyRange.max || 1}</span>
          </div>
          <button
            className={commonStyles.secondaryButton}
            onClick={resetFilters}
          >
            Reset Filters
          </button>
        </div>
      </div>
    );
  }
);

const Pagination = React.memo(
  ({
    page,
    perPage,
    nextPage,
    prevPage,
    goToPage,
    changePerPage,
    totalPages,
  }) => {
    const handlePerPageChange = useCallback(
      e => changePerPage(Number(e.target.value)),
      [changePerPage]
    );

    return (
      <div className={styles.pagination}>
        <div className={styles.perPageSelect}>
          <label>Items per page:</label>
          <select value={perPage} onChange={handlePerPageChange}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
        <div className={styles.pageControls}>
          <button
            className={commonStyles.secondaryButton}
            onClick={prevPage}
            disabled={page === 1}
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages || 1}
          </span>
          <button
            className={commonStyles.secondaryButton}
            onClick={nextPage}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      </div>
    );
  }
);

const StoryboardForm = React.memo(
  ({
    formData,
    isEditing,
    onSubmit,
    onCancel,
    onUpdate,
    isSubmitting,
    hasUnsavedChanges,
  }) => {
    const handlePlotPointChange = useCallback(
      e => onUpdate('plot_point', e.target.value),
      [onUpdate]
    );

    const handleDescriptionChange = useCallback(
      content => onUpdate('description', content),
      [onUpdate]
    );

    const handleHarmonyChange = useCallback(
      e => onUpdate('harmony_tie', parseFloat(e.target.value)),
      [onUpdate]
    );

    const harmonyColor = useMemo(
      () => calculateHarmonyColor(formData.harmony_tie),
      [formData.harmony_tie]
    );

    return (
      <form onSubmit={onSubmit} className={styles.form}>
        <h3>
          {isEditing ? 'Edit Plot Point' : 'Add New Plot Point'}
          {hasUnsavedChanges && (
            <span className={styles.unsavedIndicator}>Unsaved changes</span>
          )}
        </h3>
        <div className={commonStyles.formGroup}>
          <label htmlFor="plot_point">Plot Point</label>
          <input
            type="text"
            id="plot_point"
            className={commonStyles.formInput}
            value={formData.plot_point}
            onChange={handlePlotPointChange}
            required
          />
        </div>
        <div className={commonStyles.formGroup}>
          <label htmlFor="description">Description</label>
          <RichTextEditor
            content={formData.description}
            onChange={handleDescriptionChange}
            placeholder="Write your plot point description..."
          />
        </div>
        <div className={commonStyles.formGroup}>
          <label htmlFor="harmony_tie">
            Harmony Tie: {formData.harmony_tie.toFixed(2)}
          </label>
          <input
            type="range"
            id="harmony_tie"
            min="0"
            max="1"
            step="0.01"
            value={formData.harmony_tie}
            onChange={handleHarmonyChange}
          />
          <div
            className={styles.harmonyPreview}
            style={{ backgroundColor: harmonyColor }}
          />
        </div>
        <div className={styles.formActions}>
          <button
            type="submit"
            className={commonStyles.primaryButton}
            disabled={isSubmitting}
          >
            {isEditing ? 'Update' : 'Add'} Plot Point
          </button>
          {isEditing && (
            <button
              type="button"
              className={commonStyles.secondaryButton}
              onClick={onCancel}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    );
  }
);

const ViewToggle = ({ view, onViewChange }) => (
  <div className={styles.viewToggle}>
    <button
      className={`${styles.viewButton} ${view === 'list' ? styles.active : ''}`}
      onClick={() => onViewChange('list')}
    >
      List View
    </button>
    <button
      className={`${styles.viewButton} ${
        view === 'timeline' ? styles.active : ''
      }`}
      onClick={() => onViewChange('timeline')}
    >
      Timeline View
    </button>
  </div>
);

// Memoized selectors
const getFilteredStoryboards = createSelector(
  storyboards => storyboards,
  search => search.toLowerCase(),
  harmonyRange => harmonyRange,
  (storyboards, search, harmonyRange) => {
    return storyboards.filter(
      storyboard =>
        (storyboard.plot_point.toLowerCase().includes(search) ||
          storyboard.description.toLowerCase().includes(search)) &&
        storyboard.harmony_tie >= (harmonyRange.min || 0) &&
        storyboard.harmony_tie <= (harmonyRange.max || 1)
    );
  }
);

const getSortedStoryboards = createSelector(
  storyboards => storyboards,
  sortBy => sortBy,
  order => order,
  (storyboards, sortBy, order) => {
    return [...storyboards].sort((a, b) => {
      const multiplier = order === 'asc' ? 1 : -1;
      return multiplier * (a[sortBy] > b[sortBy] ? 1 : -1);
    });
  }
);

// Memoized components
const MemoizedTimelineItem = React.memo(TimelineItem);
const MemoizedTimelineControls = React.memo(TimelineControls);
const MemoizedPagination = React.memo(Pagination);
const MemoizedStoryboardForm = React.memo(StoryboardForm);
const MemoizedBatchOperations = React.memo(BatchOperations);

const Storyboard = ({ universeId }) => {
  const dispatch = useDispatch();
  const [view, setView] = useState('list');
  const {
    storyboards,
    isLoading,
    error,
    page,
    perPage,
    totalPages,
    sortBy,
    order,
    search,
    harmonyRange,
    nextPage,
    prevPage,
    goToPage,
    changePerPage,
    updateSort,
    updateSearch,
    updateHarmonyRange,
    resetFilters,
    refresh,
  } = useStoryboardTimeline(universeId);

  const {
    formData,
    isEditing,
    hasUnsavedChanges,
    handleSubmit,
    handleEdit,
    resetForm,
    updateField,
    clearDraft,
  } = useStoryboardForm(universeId);

  const { isSubmitting } = useSelector(state => state.storyboard);
  const [versionHistory, setVersionHistory] = useState([]);

  const debouncedSearch = useDebounce(search, 300);
  const debouncedHarmonyRange = useDebounce(harmonyRange, 300);

  // Memoized computations
  const filteredStoryboards = useMemo(
    () =>
      getFilteredStoryboards(
        storyboards,
        debouncedSearch,
        debouncedHarmonyRange
      ),
    [storyboards, debouncedSearch, debouncedHarmonyRange]
  );

  const sortedStoryboards = useMemo(
    () => getSortedStoryboards(filteredStoryboards, sortBy, order),
    [filteredStoryboards, sortBy, order]
  );

  const paginatedStoryboards = useMemo(() => {
    const start = (page - 1) * perPage;
    return sortedStoryboards.slice(start, start + perPage);
  }, [sortedStoryboards, page, perPage]);

  const handleFormSubmit = useCallback(
    async e => {
      if (formData.id) {
        const oldVersion = storyboards.find(s => s.id === formData.id);
        if (oldVersion) {
          const version = createVersion(oldVersion);
          const diff = getVersionDiff(oldVersion, formData);
          version.changes = diff.changes;
          setVersionHistory(prev => addToHistory(prev, version));
        }
      }
      await handleSubmit(e);
      refresh();
    },
    [formData, storyboards, handleSubmit, refresh]
  );

  const handleBatchDelete = useCallback(
    async ids => {
      const confirmed = window.confirm(
        `Are you sure you want to delete ${ids.length} plot points?`
      );
      if (confirmed) {
        await Promise.all(
          ids.map(id =>
            dispatch(deleteStoryboard({ universeId, storyboardId: id }))
          )
        );
        resetForm();
        refresh();
      }
    },
    [dispatch, universeId, resetForm, refresh]
  );

  const handleBatchHarmonyUpdate = useCallback(async (ids, harmonyValue) => {
    // Implementation would depend on your API structure
    console.log('Batch harmony update:', ids, harmonyValue);
  }, []);

  const handleDelete = useCallback(
    async storyboardId => {
      if (window.confirm('Are you sure you want to delete this plot point?')) {
        await dispatch(deleteStoryboard({ universeId, storyboardId }));
        resetForm();
        refresh();
      }
    },
    [dispatch, universeId, resetForm, refresh]
  );

  const handleViewChange = useCallback(newView => {
    setView(newView);
  }, []);

  useEffect(() => {
    const handleKeyboard = createShortcutHandler({
      SAVE: handleFormSubmit,
      NEW: resetForm,
      UNDO: () => {
        if (versionHistory.length > 0) {
          const previousVersion = versionHistory[0];
          handleEdit(previousVersion);
          setVersionHistory(prev => prev.slice(1));
        }
      },
      TOGGLE_VIEW: () =>
        handleViewChange(view === 'list' ? 'timeline' : 'list'),
      SEARCH: () => document.querySelector('.searchInput')?.focus(),
    });

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [
    versionHistory,
    handleFormSubmit,
    resetForm,
    handleEdit,
    handleViewChange,
    view,
  ]);

  useEffect(() => {
    const handleBeforeUnload = e => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const renderTimelineItem = useCallback(
    storyboard => (
      <TimelineItem
        key={storyboard.id}
        storyboard={storyboard}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isSelected={formData.id === storyboard.id}
      />
    ),
    [formData.id, handleEdit, handleDelete]
  );

  if (error) {
    return (
      <div className={commonStyles.error}>
        {error}
        <button className={commonStyles.secondaryButton} onClick={refresh}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <CollaborationProvider universeId={universeId}>
      <div className={`${commonStyles.container} ${styles.storyboard}`}>
        <div className={styles.timelineContainer}>
          <ViewToggle view={view} onViewChange={handleViewChange} />
          <TimelineControls
            sortBy={sortBy}
            order={order}
            updateSort={updateSort}
            search={search}
            updateSearch={updateSearch}
            harmonyRange={harmonyRange}
            updateHarmonyRange={updateHarmonyRange}
            resetFilters={resetFilters}
          />

          <BatchOperations
            storyboards={paginatedStoryboards}
            universeId={universeId}
            onBatchDelete={handleBatchDelete}
            onBatchHarmonyUpdate={handleBatchHarmonyUpdate}
          />

          {view === 'timeline' ? (
            <TimelineVisualization
              storyboards={paginatedStoryboards}
              selectedStoryboard={formData.id ? formData : null}
              onNodeClick={handleEdit}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ) : (
            <>
              <div className={styles.timeline}>
                {isLoading ? (
                  <div className={commonStyles.loading}>
                    <div className={styles.skeleton} />
                    <div className={styles.skeleton} />
                    <div className={styles.skeleton} />
                  </div>
                ) : paginatedStoryboards.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>No plot points found. Add your first one!</p>
                  </div>
                ) : (
                  <VirtualList
                    items={paginatedStoryboards}
                    renderItem={renderTimelineItem}
                    itemHeight={120}
                  />
                )}
              </div>

              {!isLoading && paginatedStoryboards.length > 0 && (
                <Pagination
                  page={page}
                  perPage={perPage}
                  nextPage={nextPage}
                  prevPage={prevPage}
                  goToPage={goToPage}
                  changePerPage={changePerPage}
                  totalPages={Math.ceil(sortedStoryboards.length / perPage)}
                />
              )}
            </>
          )}
        </div>

        <div className={styles.sidePanel}>
          <StoryboardForm
            formData={formData}
            isEditing={isEditing}
            onSubmit={handleFormSubmit}
            onCancel={resetForm}
            onUpdate={updateField}
            isSubmitting={isSubmitting}
            hasUnsavedChanges={hasUnsavedChanges}
          />
          <Presence />
          {formData.id && <Comments storyboardId={formData.id} />}
          {versionHistory.length > 0 && (
            <div className={styles.versionHistory}>
              <h4>Version History</h4>
              <div className={styles.versions}>
                {versionHistory.map((version, index) => (
                  <div key={index} className={styles.version}>
                    <div className={styles.versionHeader}>
                      <span className={styles.versionNumber}>
                        v{version.version}
                      </span>
                      <span className={styles.versionDate}>
                        {new Date(version.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className={styles.changes}>
                      {version.changes.map((change, i) => (
                        <div key={i} className={styles.change}>
                          {change}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </CollaborationProvider>
  );
};

TimelineItem.propTypes = {
  storyboard: PropTypes.shape({
    id: PropTypes.number.isRequired,
    plot_point: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    harmony_tie: PropTypes.number.isRequired,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  isSelected: PropTypes.bool.isRequired,
};

TimelineControls.propTypes = {
  sortBy: PropTypes.string.isRequired,
  order: PropTypes.string.isRequired,
  updateSort: PropTypes.func.isRequired,
  search: PropTypes.string.isRequired,
  updateSearch: PropTypes.func.isRequired,
  harmonyRange: PropTypes.shape({
    min: PropTypes.number,
    max: PropTypes.number,
  }).isRequired,
  updateHarmonyRange: PropTypes.func.isRequired,
  resetFilters: PropTypes.func.isRequired,
};

Pagination.propTypes = {
  page: PropTypes.number.isRequired,
  perPage: PropTypes.number.isRequired,
  nextPage: PropTypes.func.isRequired,
  prevPage: PropTypes.func.isRequired,
  goToPage: PropTypes.func.isRequired,
  changePerPage: PropTypes.func.isRequired,
  totalPages: PropTypes.number.isRequired,
};

StoryboardForm.propTypes = {
  formData: PropTypes.shape({
    plot_point: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    harmony_tie: PropTypes.number.isRequired,
  }).isRequired,
  isEditing: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  hasUnsavedChanges: PropTypes.bool.isRequired,
};

ViewToggle.propTypes = {
  view: PropTypes.oneOf(['list', 'timeline']).isRequired,
  onViewChange: PropTypes.func.isRequired,
};

Storyboard.propTypes = {
  universeId: PropTypes.string.isRequired,
};

export default Storyboard;
