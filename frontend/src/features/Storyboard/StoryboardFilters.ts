import PropTypes from 'prop-types';
import React from 'react';
import styles from './StoryboardFilters.module.css';

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Date Created' },
  { value: 'updatedAt', label: 'Last Modified' },
  { value: 'title', label: 'Title' },
];

const ORDER_OPTIONS = [
  { value: 'desc', label: 'Descending' },
  { value: 'asc', label: 'Ascending' },
];

const StoryboardFilters = ({
  filter,
  onFilterChange,
  sorting,
  onSortChange,
}) => {
  const handleSearchChange = e => {
    onFilterChange(e.target.value);
  };

  const handleSortFieldChange = e => {
    onSortChange({
      ...sorting,
      field: e.target.value,
    });
  };

  const handleSortOrderChange = e => {
    onSortChange({
      ...sorting,
      order: e.target.value,
    });
  };

  return (
    <div className={styles.filters}>
      <div className={styles.searchContainer}>
        <i className="fas fa-search" />
        <input
          type="text"
          placeholder="Search storyboards..."
          value={filter}
          onChange={handleSearchChange}
          className={styles.searchInput}
        />
        {filter && (
          <button
            className={styles.clearButton}
            onClick={() => onFilterChange('')}
            aria-label="Clear search"
          >
            <i className="fas fa-times" />
          </button>
        )}
      </div>

      <div className={styles.sortContainer}>
        <select
          value={sorting.field}
          onChange={handleSortFieldChange}
          className={styles.select}
        >
          {SORT_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              Sort by: {option.label}
            </option>
          ))}
        </select>

        <select
          value={sorting.order}
          onChange={handleSortOrderChange}
          className={styles.select}
        >
          {ORDER_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

StoryboardFilters.propTypes = {
  filter: PropTypes.string.isRequired,
  onFilterChange: PropTypes.func.isRequired,
  sorting: PropTypes.shape({
    field: PropTypes.string.isRequired,
    order: PropTypes.string.isRequired,
  }).isRequired,
  onSortChange: PropTypes.func.isRequired,
};

export default StoryboardFilters;
