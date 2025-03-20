import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';
import '../../styles/select.css';

/**
 * Select component for dropdown selection
 *
 * @param {Object} props - Component props
 * @param {string} props.id - Unique identifier for the select
 * @param {string|number} props.value - Current selected value
 * @param {Function} props.onChange - Function called when selection changes
 * @param {Array} props.options - Array of options objects with value and label
 * @param {string} props.placeholder - Placeholder text when no option is selected
 * @param {boolean} props.disabled - Whether the select is disabled
 * @param {boolean} props.searchable - Whether the select allows searching
 * @param {string} props.className - Additional CSS class names
 */
const Select = ({
  id,
  value,
  onChange,
  options,
  placeholder,
  disabled,
  searchable,
  className,
  ...rest
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const selectRef = useRef(null);
  const searchInputRef = useRef(null);

  // Find the selected option object
  const selectedOption = options.find(option => option.value === value);

  // Filter options based on search term
  const filteredOptions = searchTerm
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = event => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  // Toggle dropdown
  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      setSearchTerm('');
    }
  };

  // Handle option selection
  const handleSelect = option => {
    onChange(option.value);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Handle search input
  const handleSearch = e => {
    setSearchTerm(e.target.value);
  };

  // Handle keyboard navigation
  const handleKeyDown = e => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        if (!isOpen) {
          setIsOpen(true);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      case 'ArrowDown':
        if (!isOpen) {
          setIsOpen(true);
        }
        break;
      default:
        break;
    }
  };

  return (
    <div
      className={`select-container ${className || ''} ${
        disabled ? 'disabled' : ''
      }`}
      ref={selectRef}
    >
      <div
        className={`select-control ${isOpen ? 'open' : ''}`}
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={`${id}-listbox`}
        aria-labelledby={`${id}-label`}
        id={id}
        {...rest}
      >
        <div className="select-value">
          {selectedOption ? (
            <span className="select-single-value">{selectedOption.label}</span>
          ) : (
            <span className="select-placeholder">{placeholder}</span>
          )}
        </div>
        <div className="select-indicators">
          <span className="select-indicator">{isOpen ? '▲' : '▼'}</span>
        </div>
      </div>

      {isOpen && (
        <div className="select-menu" id={`${id}-listbox`} role="listbox">
          {searchable && (
            <div className="select-search">
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={handleSearch}
                placeholder="Search..."
                className="select-search-input"
                onClick={e => e.stopPropagation()}
              />
            </div>
          )}

          <div className="select-options">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => (
                <div
                  key={option.value}
                  className={`select-option ${
                    option.value === value ? 'selected' : ''
                  }`}
                  onClick={() => handleSelect(option)}
                  role="option"
                  aria-selected={option.value === value}
                >
                  {option.label}
                </div>
              ))
            ) : (
              <div className="select-no-options">No options found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

Select.propTypes = {
  id: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  searchable: PropTypes.bool,
  className: PropTypes.string,
};

Select.defaultProps = {
  value: '',
  placeholder: 'Select an option',
  disabled: false,
  searchable: false,
  className: '',
};

export default Select;
