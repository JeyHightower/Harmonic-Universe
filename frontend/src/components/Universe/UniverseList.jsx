import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUniverses } from '../../redux/slices/universeSlice';
import ErrorMessage from '../Common/ErrorMessage';
import LoadingSpinner from '../Common/LoadingSpinner';
import UniverseCard from './UniverseCard';
import './UniverseList.css';

const ITEMS_PER_PAGE = 12;

const UniverseList = () => {
  const dispatch = useDispatch();
  const { universes, isLoading, error } = useSelector(state => state.universe);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    dispatch(fetchUniverses());
  }, [dispatch]);

  // Filter universes based on search term
  const filteredUniverses = universes.filter(
    universe =>
      universe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      universe.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort universes
  const sortedUniverses = [...filteredUniverses].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    const order = sortOrder === 'asc' ? 1 : -1;

    if (typeof aValue === 'string') {
      return order * aValue.localeCompare(bValue);
    }
    return order * (aValue - bValue);
  });

  // Paginate universes
  const totalPages = Math.ceil(sortedUniverses.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedUniverses = sortedUniverses.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const handlePageChange = page => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const handleSortChange = field => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="universe-list">
      <div className="list-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search universes..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="sort-controls">
          <button
            className={`sort-button ${sortBy === 'title' ? 'active' : ''}`}
            onClick={() => handleSortChange('title')}
          >
            Title {sortBy === 'title' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button
            className={`sort-button ${sortBy === 'created_at' ? 'active' : ''}`}
            onClick={() => handleSortChange('created_at')}
          >
            Date {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </div>

      {paginatedUniverses.length === 0 ? (
        <div className="empty-state">
          <p>No universes found. Create one to get started!</p>
        </div>
      ) : (
        <>
          <div className="universe-grid">
            {paginatedUniverses.map(universe => (
              <UniverseCard key={universe.id} universe={universe} />
            ))}
          </div>

          <div className="pagination">
            <button
              className="page-button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                className={`page-button ${
                  currentPage === page ? 'active' : ''
                }`}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            ))}

            <button
              className="page-button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default UniverseList;
