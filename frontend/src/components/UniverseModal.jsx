import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  createUniverse,
  deleteUniverse,
  updateUniverse,
} from '../../../store/thunks/universeThunks';
import Button from '../../common/Button';
import Icon from '../../common/Icon';
import Input from '../../common/Input';
import Spinner from '../../common/Spinner';
import './Universe.css';

const DEFAULT_UNIVERSE = {
  name: '',
  description: '',
  physics_params: {
    gravity: { x: 0, y: -9.81, z: 0 },
    time_scale: 1.0,
    simulation_quality: 'medium',
  },
  harmony_params: {
    tempo: 120,
    root_note: 'C',
    scale_type: 'major',
  },
};

const SIMULATION_QUALITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const SCALE_OPTIONS = [
  { value: 'major', label: 'Major' },
  { value: 'minor', label: 'Minor' },
  { value: 'harmonic_minor', label: 'Harmonic Minor' },
  { value: 'melodic_minor', label: 'Melodic Minor' },
  { value: 'pentatonic', label: 'Pentatonic' },
  { value: 'blues', label: 'Blues' },
];

const ROOT_NOTE_OPTIONS = [
  { value: 'C', label: 'C' },
  { value: 'C#', label: 'C#' },
  { value: 'D', label: 'D' },
  { value: 'D#', label: 'D#' },
  { value: 'E', label: 'E' },
  { value: 'F', label: 'F' },
  { value: 'F#', label: 'F#' },
  { value: 'G', label: 'G' },
  { value: 'G#', label: 'G#' },
  { value: 'A', label: 'A' },
  { value: 'A#', label: 'A#' },
  { value: 'B', label: 'B' },
];

const UniverseModal = ({
  universeId,
  onClose,
  onSuccess,
  mode = 'create', // 'create', 'edit', 'view', 'delete'
  initialData = null,
}) => {
  const dispatch = useDispatch();
  const { currentUniverse, loading } = useSelector(state => state.universes);

  const [formData, setFormData] = useState({
    ...DEFAULT_UNIVERSE,
  });

  const [activeTab, setActiveTab] = useState('basic');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const isViewMode = mode === 'view';
  const isDeleteMode = mode === 'delete';
  const isEditMode = mode === 'edit';
  const isCreateMode = mode === 'create';
  const isReadOnly = isViewMode || isDeleteMode;

  // Set modal title based on mode
  const modalTitle = useMemo(() => {
    switch (mode) {
      case 'create':
        return 'Create New Universe';
      case 'edit':
        return 'Edit Universe';
      case 'view':
        return 'Universe Details';
      case 'delete':
        return 'Delete Universe';
      default:
        return 'Universe';
    }
  }, [mode]);

  // Initialize form values from props or Redux store
  useEffect(() => {
    let initialFormData = { ...DEFAULT_UNIVERSE };

    if (initialData) {
      initialFormData = { ...initialFormData, ...initialData };
    } else if (universeId && currentUniverse?.id === universeId) {
      initialFormData = { ...initialFormData, ...currentUniverse };
    }

    setFormData(initialFormData);
  }, [initialData, universeId, currentUniverse]);

  const validateField = (name, value) => {
    if (name === 'name' && !value.trim()) {
      return 'Name is required';
    }
    if (name === 'physics_params.time_scale' && (value < 0.1 || value > 10)) {
      return 'Time scale must be between 0.1 and 10';
    }
    if (name === 'harmony_params.tempo' && (value < 60 || value > 200)) {
      return 'Tempo must be between 60 and 200 BPM';
    }
    return '';
  };

  const handleChange = (name, value) => {
    // Handle nested properties (e.g., 'physics_params.gravity.x')
    if (name.includes('.')) {
      const keys = name.split('.');
      setFormData(prevData => {
        const newData = { ...prevData };
        let current = newData;

        // Navigate to the deepest object
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) {
            current[keys[i]] = {};
          }
          current = current[keys[i]];
        }

        // Set the value
        current[keys[keys.length - 1]] = value;
        return newData;
      });
    } else {
      setFormData(prevData => ({
        ...prevData,
        [name]: value,
      }));
    }

    // Validate the field
    const errorMessage = validateField(name, value);
    setErrors(prevErrors => ({
      ...prevErrors,
      [name]: errorMessage,
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    // Validate physics params
    if (
      formData.physics_params.time_scale < 0.1 ||
      formData.physics_params.time_scale > 10
    ) {
      newErrors['physics_params.time_scale'] =
        'Time scale must be between 0.1 and 10';
    }

    // Validate harmony params
    if (
      formData.harmony_params.tempo < 60 ||
      formData.harmony_params.tempo > 200
    ) {
      newErrors['harmony_params.tempo'] =
        'Tempo must be between 60 and 200 BPM';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (isDeleteMode) {
      setIsSubmitting(true);
      try {
        await dispatch(deleteUniverse(universeId)).unwrap();
        setShowSuccessMessage(true);
        setTimeout(() => {
          onSuccess?.('delete');
          onClose();
        }, 1500);
      } catch (error) {
        setErrors({ form: error.message || 'Failed to delete universe' });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (isViewMode) {
      onClose();
      return;
    }

    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (isCreateMode) {
        await dispatch(createUniverse(formData)).unwrap();
      } else if (isEditMode) {
        await dispatch(
          updateUniverse({ universeId, universeData: formData })
        ).unwrap();
      }

      setShowSuccessMessage(true);
      setTimeout(() => {
        onSuccess?.(isCreateMode ? 'create' : 'update', formData);
        onClose();
      }, 1500);
    } catch (error) {
      setErrors({
        form: error.message || 'An error occurred while saving the universe',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderTabs = () => {
    return (
      <div className="modal-tabs">
        <button
          className={`tab-button ${activeTab === 'basic' ? 'active' : ''}`}
          onClick={() => setActiveTab('basic')}
        >
          <Icon name="info" size="small" />
          Basic Info
        </button>
        <button
          className={`tab-button ${activeTab === 'physics' ? 'active' : ''}`}
          onClick={() => setActiveTab('physics')}
        >
          <Icon name="physics" size="small" />
          Physics
        </button>
        <button
          className={`tab-button ${activeTab === 'harmony' ? 'active' : ''}`}
          onClick={() => setActiveTab('harmony')}
        >
          <Icon name="music" size="small" />
          Harmony
        </button>
      </div>
    );
  };

  const renderBasicTab = () => {
    return (
      <div className="form-section">
        <div className="form-row">
          <div className="form-group">
            <Input
              label="Name"
              type="text"
              name="name"
              value={formData.name}
              onChange={e => handleChange('name', e.target.value)}
              error={errors.name}
              readOnly={isReadOnly}
              required
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <Input
              label="Description"
              type="textarea"
              name="description"
              value={formData.description}
              onChange={e => handleChange('description', e.target.value)}
              error={errors.description}
              readOnly={isReadOnly}
              rows={4}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderPhysicsTab = () => {
    return (
      <div className="form-section">
        <div className="form-row">
          <div className="form-group">
            <h3>Gravity</h3>
            <div className="form-row">
              <div className="form-group">
                <Input
                  label="X"
                  type="number"
                  step="0.01"
                  name="physics_params.gravity.x"
                  value={formData.physics_params.gravity.x.toString()}
                  onChange={e =>
                    handleChange(
                      'physics_params.gravity.x',
                      parseFloat(e.target.value)
                    )
                  }
                  error={errors['physics_params.gravity.x']}
                  readOnly={isReadOnly}
                />
              </div>
              <div className="form-group">
                <Input
                  label="Y"
                  type="number"
                  step="0.01"
                  name="physics_params.gravity.y"
                  value={formData.physics_params.gravity.y.toString()}
                  onChange={e =>
                    handleChange(
                      'physics_params.gravity.y',
                      parseFloat(e.target.value)
                    )
                  }
                  error={errors['physics_params.gravity.y']}
                  readOnly={isReadOnly}
                />
              </div>
              <div className="form-group">
                <Input
                  label="Z"
                  type="number"
                  step="0.01"
                  name="physics_params.gravity.z"
                  value={formData.physics_params.gravity.z.toString()}
                  onChange={e =>
                    handleChange(
                      'physics_params.gravity.z',
                      parseFloat(e.target.value)
                    )
                  }
                  error={errors['physics_params.gravity.z']}
                  readOnly={isReadOnly}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <Input
              label="Time Scale"
              type="number"
              step="0.1"
              min="0.1"
              max="10"
              name="physics_params.time_scale"
              value={formData.physics_params.time_scale.toString()}
              onChange={e =>
                handleChange(
                  'physics_params.time_scale',
                  parseFloat(e.target.value)
                )
              }
              error={errors['physics_params.time_scale']}
              readOnly={isReadOnly}
              help="Simulation speed (1.0 = real-time)"
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Simulation Quality</label>
            <select
              name="physics_params.simulation_quality"
              value={formData.physics_params.simulation_quality}
              onChange={e =>
                handleChange(
                  'physics_params.simulation_quality',
                  e.target.value
                )
              }
              disabled={isReadOnly}
              className="form-select"
            >
              {SIMULATION_QUALITY_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  };

  const renderHarmonyTab = () => {
    return (
      <div className="form-section">
        <div className="form-row">
          <div className="form-group">
            <Input
              label="Tempo (BPM)"
              type="number"
              min="60"
              max="200"
              name="harmony_params.tempo"
              value={formData.harmony_params.tempo.toString()}
              onChange={e =>
                handleChange('harmony_params.tempo', parseFloat(e.target.value))
              }
              error={errors['harmony_params.tempo']}
              readOnly={isReadOnly}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Root Note</label>
            <select
              name="harmony_params.root_note"
              value={formData.harmony_params.root_note}
              onChange={e =>
                handleChange('harmony_params.root_note', e.target.value)
              }
              disabled={isReadOnly}
              className="form-select"
            >
              {ROOT_NOTE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Scale Type</label>
            <select
              name="harmony_params.scale_type"
              value={formData.harmony_params.scale_type}
              onChange={e =>
                handleChange('harmony_params.scale_type', e.target.value)
              }
              disabled={isReadOnly}
              className="form-select"
            >
              {SCALE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  };

  const renderModalContent = () => {
    if (isDeleteMode) {
      return (
        <div className="delete-confirmation">
          <div className="warning-icon">
            <Icon name="warning" size="large" />
          </div>
          <p>
            Are you sure you want to delete <strong>{formData.name}</strong>?
            This action cannot be undone.
          </p>
          <p>
            All scenes, physics objects, and related data will be permanently
            deleted.
          </p>

          {errors.form && <div className="error-message">{errors.form}</div>}

          {showSuccessMessage && (
            <div className="success-message">
              <Icon name="check" size="small" />
              Universe deleted successfully!
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="form-container">
        {!isViewMode && (
          <div className="form-instructions">
            <p>
              {isCreateMode
                ? 'Enter the details for your new universe.'
                : 'Update the details of your universe.'}
            </p>
          </div>
        )}

        {errors.form && <div className="error-message">{errors.form}</div>}

        {showSuccessMessage && (
          <div className="success-message">
            <Icon name="check" size="small" />
            Universe {isCreateMode ? 'created' : 'updated'} successfully!
          </div>
        )}

        {renderTabs()}

        <div className="tab-content">
          {activeTab === 'basic' && renderBasicTab()}
          {activeTab === 'physics' && renderPhysicsTab()}
          {activeTab === 'harmony' && renderHarmonyTab()}
        </div>

        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {isReadOnly ? 'Close' : 'Cancel'}
          </Button>
          <Button
            variant={isDeleteMode ? 'danger' : 'primary'}
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={
              isSubmitting ||
              (mode !== 'view' &&
                mode !== 'delete' &&
                Object.values(errors).some(Boolean))
            }
          >
            {isSubmitting ? (
              <Spinner size="small" />
            ) : (
              <>
                {isDeleteMode && <Icon name="delete" size="small" />}
                {isCreateMode && 'Create'}
                {isEditMode && 'Update'}
                {isViewMode && 'Close'}
                {isDeleteMode && 'Delete'}
              </>
            )}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="universe-modal">
      <div className="modal-header">
        <h2 className="modal-title">
          <Icon
            name={isDeleteMode ? 'delete' : 'universe'}
            size="medium"
            className="modal-title-icon"
          />
          {modalTitle}
        </h2>
        {formData.name && !isCreateMode && (
          <div className="universe-name">{formData.name}</div>
        )}
      </div>
      <div className="modal-content">{renderModalContent()}</div>
    </div>
  );
};

export default UniverseModal;
