import { UserOutlined } from '@ant-design/icons';
import { Avatar, Empty, Select, Spin } from 'antd';
import { useEffect, useState } from 'react';
import { apiClient } from '../../../services/api.adapter.mjs';
import '../styles/Character.css';

const { Option } = Select;

/**
 * CharacterSelector component for selecting multiple characters
 * @param {Object} props - Component props
 * @param {string} props.universeId - ID of the universe to fetch characters from
 * @param {Array} props.characters - Optional pre-loaded characters
 * @param {Array} props.value - Currently selected character IDs
 * @param {Function} props.onChange - Callback for when selection changes
 * @param {boolean} props.disabled - Whether the selector is disabled
 * @param {Function} props.onBlur - Callback for when the selector loses focus
 */
const CharacterSelector = ({
  universeId,
  characters: providedCharacters,
  value,
  onChange,
  disabled = false,
  onBlur,
  getPopupContainer = (trigger) => trigger.parentNode,
}) => {
  const [characters, setCharacters] = useState(
    Array.isArray(providedCharacters) ? providedCharacters : []
  );
  const [loading, setLoading] = useState(!providedCharacters);
  const [open, setOpen] = useState(false);

  // Create mock characters for production fallback
  const createMockCharacters = () => {
    return [
      { id: 1001, name: 'Demo Character 1' },
      { id: 1002, name: 'Demo Character 2' },
    ];
  };

  // Handle dropdown visibility change
  const handleDropdownVisibleChange = (visible) => {
    setOpen(visible);
    // When closing dropdown, trigger onBlur if provided
    if (!visible && onBlur && typeof onBlur === 'function') {
      setTimeout(() => onBlur(), 100);
    }
  };

  // Handle manual blur
  const handleBlur = () => {
    if (onBlur && typeof onBlur === 'function') {
      onBlur();
    }
  };

  useEffect(() => {
    if (providedCharacters) {
      setCharacters(Array.isArray(providedCharacters) ? providedCharacters : []);
      setLoading(false);
      return;
    }

    const fetchCharacters = async () => {
      if (!universeId) return;

      try {
        setLoading(true);
        const response = await apiClient.universes.getUniverseCharacters(universeId);

        // Extract characters data with better error handling
        let charactersData = [];

        if (response?.data?.characters && Array.isArray(response.data.characters)) {
          charactersData = response.data.characters;
        } else if (Array.isArray(response?.data)) {
          charactersData = response.data;
        } else if (response?.data) {
          // Try to find any array in the response that might contain characters
          const possibleArrays = Object.entries(response.data)
            .filter(([_, value]) => Array.isArray(value))
            .sort(([_, a], [__, b]) => b.length - a.length);

          if (possibleArrays.length > 0) {
            console.log(
              `CharacterSelector - Found potential characters array in response.data.${possibleArrays[0][0]}`
            );
            charactersData = possibleArrays[0][1];
          }
        }

        // Always ensure we have an array
        setCharacters(Array.isArray(charactersData) ? charactersData : []);
      } catch (error) {
        console.error('CharacterSelector - Error fetching characters:', error);

        // Use mock characters in production on error
        const isProduction = !window.location.hostname.includes('localhost');
        if (isProduction) {
          console.log('Using mock characters due to error in production');
          setCharacters(createMockCharacters());
        } else {
          // Set an empty array on error in development
          setCharacters([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCharacters();
  }, [universeId, providedCharacters]);

  const handleChange = (selectedIds) => {
    if (onChange) {
      onChange(selectedIds);
    }
  };

  return (
    <Select
      mode="multiple"
      style={{ width: '100%' }}
      placeholder="Select characters in this scene"
      value={value}
      onChange={handleChange}
      optionFilterProp="children"
      loading={loading}
      disabled={disabled}
      getPopupContainer={getPopupContainer}
      dropdownStyle={{ zIndex: 1100 }}
      listHeight={250}
      onDropdownVisibleChange={handleDropdownVisibleChange}
      onBlur={handleBlur}
      open={open}
      autoComplete="off"
      notFoundContent={
        loading ? <Spin size="small" /> : <Empty description="No characters found" />
      }
      maxTagCount={5}
      maxTagTextLength={12}
      virtual={true}
    >
      {Array.isArray(characters) && characters.length > 0 ? (
        characters.map((character) => (
          <Option key={character.id} value={character.id}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {character.avatar ? (
                <Avatar src={character.avatar} size="small" style={{ marginRight: 8 }} />
              ) : (
                <Avatar icon={<UserOutlined />} size="small" style={{ marginRight: 8 }} />
              )}
              {character.name}
            </div>
          </Option>
        ))
      ) : (
        <Option disabled value="no-characters">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Avatar icon={<UserOutlined />} size="small" style={{ marginRight: 8 }} />
            No characters available
          </div>
        </Option>
      )}
    </Select>
  );
};

export default CharacterSelector;
