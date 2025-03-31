import React, { useState, useEffect } from "react";
import { Select, Empty, Spin, Avatar } from "antd";
import { UserOutlined } from "@ant-design/icons";
import apiClient from "../../services/api";

const { Option } = Select;

/**
 * CharacterSelector component for selecting multiple characters
 * @param {Object} props - Component props
 * @param {string} props.universeId - ID of the universe to fetch characters from
 * @param {Array} props.characters - Optional pre-loaded characters
 * @param {Array} props.value - Currently selected character IDs
 * @param {Function} props.onChange - Callback for when selection changes
 * @param {boolean} props.disabled - Whether the selector is disabled
 */
const CharacterSelector = ({
  universeId,
  characters: providedCharacters,
  value,
  onChange,
  disabled = false,
}) => {
  const [characters, setCharacters] = useState(providedCharacters || []);
  const [loading, setLoading] = useState(!providedCharacters);

  useEffect(() => {
    if (providedCharacters) {
      setCharacters(providedCharacters);
      setLoading(false);
      return;
    }

    const fetchCharacters = async () => {
      if (!universeId) return;

      try {
        setLoading(true);
        const response = await apiClient.getCharactersByUniverse(universeId);
        const charactersData = response.data?.characters || response.data || [];
        setCharacters(charactersData);
      } catch (error) {
        console.error("CharacterSelector - Error fetching characters:", error);
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
      style={{ width: "100%" }}
      placeholder="Select characters in this scene"
      value={value}
      onChange={handleChange}
      optionFilterProp="children"
      loading={loading}
      disabled={disabled}
      notFoundContent={
        loading ? (
          <Spin size="small" />
        ) : (
          <Empty description="No characters found" />
        )
      }
      maxTagCount={5}
      maxTagTextLength={12}
    >
      {characters.map((character) => (
        <Option key={character.id} value={character.id}>
          <div style={{ display: "flex", alignItems: "center" }}>
            {character.avatar ? (
              <Avatar
                src={character.avatar}
                size="small"
                style={{ marginRight: 8 }}
              />
            ) : (
              <Avatar
                icon={<UserOutlined />}
                size="small"
                style={{ marginRight: 8 }}
              />
            )}
            {character.name}
          </div>
        </Option>
      ))}
    </Select>
  );
};

export default CharacterSelector;
