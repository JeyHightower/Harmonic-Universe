import PropTypes from 'prop-types';
import React from 'react';
import styles from './StoryboardPagination.module.css';

const StoryboardPagination = ({ currentPage, totalPages, onPageChange }) => {
  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // First page
    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => onPageChange(1)}
          className={`${styles.pageButton} ${
            currentPage === 1 ? styles.active : ''
          }`}
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(
          <span key="ellipsis1" className={styles.ellipsis}>
            ...
          </span>
        );
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`${styles.pageButton} ${
            currentPage === i ? styles.active : ''
          }`}
        >
          {i}
        </button>
      );
    }

    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="ellipsis2" className={styles.ellipsis}>
            ...
          </span>
        );
      }
      pages.push(
        <button
          key={totalPages}
          onClick={() => onPageChange(totalPages)}
          className={`${styles.pageButton} ${
            currentPage === totalPages ? styles.active : ''
          }`}
        >
          {totalPages}
        </button>
      );
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className={styles.pagination}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`${styles.pageButton} ${styles.navButton}`}
        aria-label="Previous page"
      >
        <i className="fas fa-chevron-left" />
      </button>

      {renderPageNumbers()}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`${styles.pageButton} ${styles.navButton}`}
        aria-label="Next page"
      >
        <i className="fas fa-chevron-right" />
      </button>
    </div>
  );
};

StoryboardPagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
};

export default StoryboardPagination;
