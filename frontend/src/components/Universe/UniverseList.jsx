import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeGrid } from 'react-window';
import useWebSocket from '../../hooks/useWebSocket';
import { fetchUniverses } from '../../store/universeSlice';
import ErrorMessage from '../Common/ErrorMessage';
import LoadingSpinner from '../Common/LoadingSpinner';
import UniverseCard from './UniverseCard';
import './UniverseList.css';

const ITEMS_PER_PAGE = 12;
const COLUMN_COUNT = 3;
const CARD_HEIGHT = 400;
const CARD_WIDTH = 350;

const UniverseList = () => {
  const dispatch = useDispatch();
  const { universes, isLoading, error } = useSelector(state => state.universe);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedUniverse, setSelectedUniverse] = useState(null);

  // Memoize WebSocket handlers
  const wsHandlers = useMemo(
    () => ({
      universe_created: data => {
        dispatch(fetchUniverses());
      },
      universe_updated: data => {
        dispatch(fetchUniverses());
      },
      universe_deleted: data => {
        dispatch(fetchUniverses());
      },
      error: error => {
        console.error('WebSocket error:', error);
      },
    }),
    [dispatch]
  );

  const { isConnected, emit } = useWebSocket('ws://localhost:5000', {
    handlers: wsHandlers,
    onConnect: () => console.log('Connected to WebSocket'),
    onDisconnect: () => console.log('Disconnected from WebSocket'),
    onError: error => console.error('WebSocket error:', error),
  });

  useEffect(() => {
    dispatch(fetchUniverses());
  }, [dispatch]);

  // Memoize handlers
  const handleCreate = useCallback(
    universeData => {
      emit('universe_update', {
        action: 'create',
        ...universeData,
      });
    },
    [emit]
  );

  const handleUpdate = useCallback(
    (universeId, updateData) => {
      emit('universe_update', {
        action: 'update',
        id: universeId,
        ...updateData,
      });
    },
    [emit]
  );

  const handleDelete = useCallback(
    universeId => {
      emit('universe_update', {
        action: 'delete',
        id: universeId,
      });
    },
    [emit]
  );

  // Memoize filtered and sorted universes
  const filteredAndSortedUniverses = useMemo(() => {
    const filtered = universes.filter(
      universe =>
        universe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        universe.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return [...filtered].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      const order = sortOrder === 'asc' ? 1 : -1;

      if (typeof aValue === 'string') {
        return order * aValue.localeCompare(bValue);
      }
      return order * (aValue - bValue);
    });
  }, [universes, searchTerm, sortBy, sortOrder]);

  // Memoize paginated universes
  const paginatedUniverses = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedUniverses.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );
  }, [filteredAndSortedUniverses, currentPage]);

  const totalPages = Math.ceil(
    filteredAndSortedUniverses.length / ITEMS_PER_PAGE
  );

  const handlePageChange = useCallback(page => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  }, []);

  const handleSortChange = useCallback(field => {
    setSortBy(prevSortBy => {
      if (prevSortBy === field) {
        setSortOrder(prevOrder => (prevOrder === 'asc' ? 'desc' : 'asc'));
        return field;
      }
      setSortOrder('desc');
      return field;
    });
  }, []);

  // Memoized grid cell renderer
  const Cell = useCallback(
    ({ columnIndex, rowIndex, style }) => {
      const index = rowIndex * COLUMN_COUNT + columnIndex;
      const universe = paginatedUniverses[index];

      if (!universe) return null;

      return (
        <div style={style}>
          <UniverseCard
            key={universe.id}
            universe={universe}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            selected={selectedUniverse === universe.id}
            onSelect={() => setSelectedUniverse(universe.id)}
          />
        </div>
      );
    },
    [paginatedUniverses, handleUpdate, handleDelete, selectedUniverse]
  );

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="universe-list">
      <div className="universe-list-header">
        <h2>Universes</h2>
        {isConnected && (
          <span className="connection-status connected">Connected</span>
        )}
        {!isConnected && (
          <span className="connection-status disconnected">Disconnected</span>
        )}
      </div>

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
          <div className="universe-grid" style={{ height: '800px' }}>
            <AutoSizer>
              {({ height, width }) => (
                <FixedSizeGrid
                  columnCount={COLUMN_COUNT}
                  columnWidth={CARD_WIDTH}
                  height={height}
                  rowCount={Math.ceil(paginatedUniverses.length / COLUMN_COUNT)}
                  rowHeight={CARD_HEIGHT}
                  width={width}
                >
                  {Cell}
                </FixedSizeGrid>
              )}
            </AutoSizer>
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

export default React.memo(UniverseList);
