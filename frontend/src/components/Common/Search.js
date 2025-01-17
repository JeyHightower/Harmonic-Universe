import { useState, useEffect, useRef } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import styles from './Search.module.css';

const Search = ({ onSearch, filters = [], placeholder = 'Search...' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [isOpen, setIsOpen] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleSearch = () => {
      onSearch({
        term: debouncedSearchTerm,
        filters: activeFilters
      });
    };

    handleSearch();
  }, [debouncedSearchTerm, activeFilters, onSearch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFilterChange = (filterId, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterId]: value
    }));
  };

  return (
    <div className={styles.searchContainer} ref={searchRef}>
      <div className={styles.searchBar}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder}
          className={styles.searchInput}
        />
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={styles.filterButton}
        >
          Filters
        </button>
      </div>

      {isOpen && (
        <div className={styles.filterPanel}>
          {filters.map(filter => (
            <div key={filter.id} className={styles.filterItem}>
              <label>{filter.label}</label>
              {filter.type === 'select' ? (
                <select
                  value={activeFilters[filter.id] || ''}
                  onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                  className={styles.select}
                >
                  <option value="">All</option>
                  {filter.options.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : filter.type === 'range' ? (
                <div className={styles.rangeContainer}>
                  <input
                    type="range"
                    min={filter.min}
                    max={filter.max}
                    value={activeFilters[filter.id] || filter.min}
                    onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                    className={styles.range}
                  />
                  <span>{activeFilters[filter.id] || filter.min}</span>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Search;
