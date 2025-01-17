import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  addForceField,
  fetchForceFields,
  removeForceField,
  updateForceField,
} from '../../redux/slices/physicsSlice';
import './ForceFieldEditor.css';

const ForceFieldEditor = ({ universeId }) => {
  const dispatch = useDispatch();
  const forceFields = useSelector(state => state.physics.forceFields);
  const [selectedField, setSelectedField] = useState(null);
  const [editingField, setEditingField] = useState({
    type: 'radial',
    strength: 100,
    radius: 100,
    x: 400,
    y: 300,
    falloff: 'inverse-square',
  });

  useEffect(() => {
    dispatch(fetchForceFields(universeId));
  }, [dispatch, universeId]);

  const handleFieldChange = (field, value) => {
    setEditingField(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddField = () => {
    const newField = {
      ...editingField,
      id: Date.now(),
    };
    dispatch(addForceField(newField));
  };

  const handleUpdateField = () => {
    if (selectedField) {
      dispatch(
        updateForceField({
          universeId,
          fieldId: selectedField.id,
          fieldData: editingField,
        })
      );
      setSelectedField(null);
    }
  };

  const handleDeleteField = fieldId => {
    dispatch(removeForceField(fieldId));
    if (selectedField?.id === fieldId) {
      setSelectedField(null);
    }
  };

  const handleSelectField = field => {
    setSelectedField(field);
    setEditingField(field);
  };

  return (
    <div className="force-field-editor">
      <h3>Force Fields</h3>

      <div className="field-list">
        {forceFields.map(field => (
          <div
            key={field.id}
            className={`field-item ${
              selectedField?.id === field.id ? 'selected' : ''
            }`}
            onClick={() => handleSelectField(field)}
          >
            <div className="field-info">
              <span className="field-type">{field.type}</span>
              <span className="field-strength">Strength: {field.strength}</span>
            </div>
            <button
              className="delete-button"
              onClick={e => {
                e.stopPropagation();
                handleDeleteField(field.id);
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="field-editor">
        <div className="field-property">
          <label>Type</label>
          <select
            value={editingField.type}
            onChange={e => handleFieldChange('type', e.target.value)}
          >
            <option value="radial">Radial</option>
            <option value="directional">Directional</option>
            <option value="vortex">Vortex</option>
          </select>
        </div>

        <div className="field-property">
          <label>Strength</label>
          <input
            type="range"
            min="-500"
            max="500"
            value={editingField.strength}
            onChange={e =>
              handleFieldChange('strength', parseInt(e.target.value))
            }
          />
          <span>{editingField.strength}</span>
        </div>

        <div className="field-property">
          <label>Radius</label>
          <input
            type="range"
            min="10"
            max="300"
            value={editingField.radius}
            onChange={e =>
              handleFieldChange('radius', parseInt(e.target.value))
            }
          />
          <span>{editingField.radius}px</span>
        </div>

        <div className="field-property">
          <label>Falloff</label>
          <select
            value={editingField.falloff}
            onChange={e => handleFieldChange('falloff', e.target.value)}
          >
            <option value="linear">Linear</option>
            <option value="inverse">Inverse</option>
            <option value="inverse-square">Inverse Square</option>
          </select>
        </div>

        <div className="field-actions">
          {selectedField ? (
            <button onClick={handleUpdateField}>Update Field</button>
          ) : (
            <button onClick={handleAddField}>Add Field</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForceFieldEditor;
