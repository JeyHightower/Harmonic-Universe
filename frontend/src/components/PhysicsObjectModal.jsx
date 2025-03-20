import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  createPhysicsObject,
  deletePhysicsObject,
  updatePhysicsObject,
} from '../../../store/thunks/physicsObjectsThunks';
import Button from '../../common/Button';
import Icon from '../../common/Icon';
import Input from '../../common/Input';
import Spinner from '../../common/Spinner';
import './PhysicsObjects.css';

const DEFAULT_PHYSICS_OBJECT = {
  name: '',
  mass: 1.0,
  is_static: false,
  is_trigger: false,
  collision_shape: 'box',
  position: { x: 0, y: 0, z: 0 },
  velocity: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
  material_properties: {
    restitution: 0.7,
    friction: 0.3,
    density: 1.0,
  },
};

const COLLISION_SHAPE_OPTIONS = [
  { value: 'box', label: 'Box', icon: 'box' },
  { value: 'sphere', label: 'Sphere', icon: 'sphere' },
  { value: 'capsule', label: 'Capsule', icon: 'capsule' },
  { value: 'cylinder', label: 'Cylinder', icon: 'cylinder' },
  { value: 'cone', label: 'Cone', icon: 'cone' },
  { value: 'plane', label: 'Plane', icon: 'plane' },
];

const PhysicsObjectModal = ({
  sceneId,
  objectId,
  onClose,
  onSuccess,
  mode = 'create', // 'create', 'edit', 'view', 'delete'
  initialData = null,
}) => {
  const dispatch = useDispatch();
  const { currentPhysicsObject, loading } = useSelector(
    state => state.physicsObjects
  );

  const [formData, setFormData] = useState({
    ...DEFAULT_PHYSICS_OBJECT,
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
        return 'Create New Physics Object';
      case 'edit':
        return 'Edit Physics Object';
      case 'view':
        return 'Physics Object Details';
      case 'delete':
        return 'Delete Physics Object';
      default:
        return 'Physics Object';
    }
  }, [mode]);

  // Initialize form values from props or Redux store
  useEffect(() => {
    let initialFormData = { ...DEFAULT_PHYSICS_OBJECT };

    if (initialData) {
      initialFormData = { ...initialFormData, ...initialData };
    } else if (objectId && currentPhysicsObject?.id === objectId) {
      initialFormData = { ...initialFormData, ...currentPhysicsObject };
    }

    setFormData(initialFormData);
  }, [initialData, objectId, currentPhysicsObject]);

  const validateField = (name, value) => {
    if (name === 'name' && !value.trim()) {
      return 'Name is required';
    }

    if (name === 'mass') {
      if (value < 0) {
        return 'Mass cannot be negative';
      }
      if (value === 0 && !formData.is_static) {
        return 'Dynamic objects must have mass greater than 0';
      }
    }

    if (name.includes('material_properties.restitution')) {
      if (value < 0 || value > 1) {
        return 'Restitution must be between 0 and 1';
      }
    }

    if (name.includes('material_properties.friction')) {
      if (value < 0) {
        return 'Friction cannot be negative';
      }
    }

    return null;
  };

  const validateForm = () => {
    const newErrors = {};

    // Basic validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.mass < 0) {
      newErrors.mass = 'Mass cannot be negative';
    }

    if (formData.mass === 0 && !formData.is_static) {
      newErrors.mass = 'Dynamic objects must have mass greater than 0';
    }

    // Material properties validation
    const { restitution, friction, density } = formData.material_properties;

    if (restitution < 0 || restitution > 1) {
      newErrors['material_properties.restitution'] =
        'Restitution must be between 0 and 1';
    }

    if (friction < 0) {
      newErrors['material_properties.friction'] = 'Friction cannot be negative';
    }

    if (density < 0) {
      newErrors['material_properties.density'] = 'Density cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (name, value) => {
    // Special case for is_static changing
    if (name === 'is_static' && value === true) {
      // If making an object static, set mass to 0
      setFormData(prev => ({
        ...prev,
        [name]: value,
        mass: 0,
      }));
      return;
    }

    // For nested properties like position.x
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }

    // Validate the field
    const errorMessage = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: errorMessage,
    }));
  };

  const handleSubmit = async () => {
    if (isReadOnly) {
      onClose();
      return;
    }

    if (!validateForm()) {
      return; // Don't submit if validation fails
    }

    setIsSubmitting(true);
    setShowSuccessMessage(false);

    try {
      let result;

      // Perform the action based on mode
      switch (mode) {
        case 'edit':
          result = await dispatch(
            updatePhysicsObject({
              id: objectId,
              data: formData,
            })
          ).unwrap();
          setShowSuccessMessage(true);
          break;

        case 'create':
          result = await dispatch(
            createPhysicsObject({
              ...formData,
              scene_id: sceneId,
            })
          ).unwrap();
          setShowSuccessMessage(true);
          break;

        case 'delete':
          await dispatch(deletePhysicsObject(objectId)).unwrap();
          if (onSuccess) {
            onSuccess();
          }
          onClose();
          return;

        default:
          break;
      }

      // Call the onSuccess callback with the result
      if (onSuccess) {
        setTimeout(() => {
          onSuccess(result);
        }, 1000); // Show success message for 1 second before closing
      }

      // Close the modal after a delay
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Error saving physics object:', error);
      setErrors(prev => ({
        ...prev,
        form: error.message || 'An error occurred while saving',
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderVector3Input = (label, baseName, vector, readOnly = false) => {
    return (
      <div className="vector-input-group">
        <label className="vector-label">{label}</label>
        <div className="vector-inputs">
          <div className="vector-input">
            <Input
              label="X"
              type="number"
              name={`${baseName}.x`}
              value={vector.x.toString()}
              onChange={e =>
                handleChange(`${baseName}.x`, parseFloat(e.target.value))
              }
              error={errors[`${baseName}.x`]}
              readOnly={readOnly}
            />
          </div>
          <div className="vector-input">
            <Input
              label="Y"
              type="number"
              name={`${baseName}.y`}
              value={vector.y.toString()}
              onChange={e =>
                handleChange(`${baseName}.y`, parseFloat(e.target.value))
              }
              error={errors[`${baseName}.y`]}
              readOnly={readOnly}
            />
          </div>
          <div className="vector-input">
            <Input
              label="Z"
              type="number"
              name={`${baseName}.z`}
              value={vector.z.toString()}
              onChange={e =>
                handleChange(`${baseName}.z`, parseFloat(e.target.value))
              }
              error={errors[`${baseName}.z`]}
              readOnly={readOnly}
            />
          </div>
        </div>
      </div>
    );
  };

  // Modal content based on mode
  const renderModalContent = () => {
    // Delete confirmation
    if (isDeleteMode) {
      return (
        <div className="physics-object-delete-confirmation">
          <div className="delete-icon-container">
            <Icon name="warning" size="large" className="warning-icon" />
          </div>
          <p className="delete-confirmation-text">
            Are you sure you want to delete <strong>{formData.name}</strong>?
            This action cannot be undone and all physics properties and
            relationships will be permanently lost.
          </p>
        </div>
      );
    }

    // Form view
    return (
      <div className="physics-object-form">
        <div className="form-tabs">
          <button
            className={`tab-button ${activeTab === 'basic' ? 'active' : ''}`}
            onClick={() => setActiveTab('basic')}
          >
            <Icon name="basic" size="small" />
            Basic Properties
          </button>
          <button
            className={`tab-button ${activeTab === 'position' ? 'active' : ''}`}
            onClick={() => setActiveTab('position')}
          >
            <Icon name="position" size="small" />
            Position & Rotation
          </button>
          <button
            className={`tab-button ${activeTab === 'material' ? 'active' : ''}`}
            onClick={() => setActiveTab('material')}
          >
            <Icon name="material" size="small" />
            Material
          </button>
        </div>

        {/* Show success message */}
        {showSuccessMessage && (
          <div className="success-message">
            <Icon name="check" size="small" />
            {isCreateMode
              ? 'Physics object created successfully!'
              : 'Physics object updated successfully!'}
          </div>
        )}

        {/* Show form error if any */}
        {errors.form && (
          <div className="form-error">
            <Icon name="error" size="small" />
            {errors.form}
          </div>
        )}

        {/* Tab content */}
        <div className="tab-content">
          {/* Basic Properties Tab */}
          <div className={`tab-pane ${activeTab === 'basic' ? 'active' : ''}`}>
            <div className="form-group">
              <Input
                label="Name"
                type="text"
                name="name"
                value={formData.name}
                onChange={e => handleChange('name', e.target.value)}
                error={errors.name}
                required
                readOnly={isReadOnly}
              />
            </div>

            <div className="form-group">
              <Input
                label="Mass (kg)"
                type="number"
                name="mass"
                value={formData.mass.toString()}
                onChange={e => handleChange('mass', parseFloat(e.target.value))}
                error={errors.mass}
                disabled={formData.is_static}
                readOnly={isReadOnly}
                help={
                  formData.is_static
                    ? 'Static objects have infinite mass'
                    : 'Mass affects how the object responds to forces'
                }
              />
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.is_static}
                  onChange={e => handleChange('is_static', e.target.checked)}
                  disabled={isReadOnly}
                />
                Static Object
                <span className="checkbox-help">
                  Static objects don't move or rotate
                </span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.is_trigger}
                  onChange={e => handleChange('is_trigger', e.target.checked)}
                  disabled={isReadOnly}
                />
                Trigger
                <span className="checkbox-help">
                  Triggers detect collisions but don't physically interact
                </span>
              </label>
            </div>

            <div className="form-group">
              <label className="select-label">Collision Shape</label>
              <div className="collision-shape-selector">
                {COLLISION_SHAPE_OPTIONS.map(option => (
                  <label
                    key={option.value}
                    className={`collision-shape-option ${
                      formData.collision_shape === option.value
                        ? 'selected'
                        : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="collision_shape"
                      value={option.value}
                      checked={formData.collision_shape === option.value}
                      onChange={e =>
                        handleChange('collision_shape', e.target.value)
                      }
                      disabled={isReadOnly}
                    />
                    <div className="shape-icon">
                      <Icon name={option.icon} size="medium" />
                    </div>
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Position & Rotation Tab */}
          <div
            className={`tab-pane ${activeTab === 'position' ? 'active' : ''}`}
          >
            <div className="form-section">
              {renderVector3Input(
                'Position',
                'position',
                formData.position,
                isReadOnly
              )}
              {renderVector3Input(
                'Velocity',
                'velocity',
                formData.velocity,
                isReadOnly
              )}
              {renderVector3Input(
                'Rotation',
                'rotation',
                formData.rotation,
                isReadOnly
              )}
              {renderVector3Input('Scale', 'scale', formData.scale, isReadOnly)}
            </div>
          </div>

          {/* Material Properties Tab */}
          <div
            className={`tab-pane ${activeTab === 'material' ? 'active' : ''}`}
          >
            <div className="form-section">
              <div className="form-group">
                <Input
                  label="Restitution (Bounciness)"
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  name="material_properties.restitution"
                  value={formData.material_properties.restitution.toString()}
                  onChange={e =>
                    handleChange(
                      'material_properties.restitution',
                      parseFloat(e.target.value)
                    )
                  }
                  error={errors['material_properties.restitution']}
                  readOnly={isReadOnly}
                  help="How bouncy the object is (0 = no bounce, 1 = perfect bounce)"
                />
              </div>
              <div className="form-group">
                <Input
                  label="Friction"
                  type="number"
                  min="0"
                  step="0.1"
                  name="material_properties.friction"
                  value={formData.material_properties.friction.toString()}
                  onChange={e =>
                    handleChange(
                      'material_properties.friction',
                      parseFloat(e.target.value)
                    )
                  }
                  error={errors['material_properties.friction']}
                  readOnly={isReadOnly}
                  help="How much the object resists sliding (0 = no friction)"
                />
              </div>
              <div className="form-group">
                <Input
                  label="Density"
                  type="number"
                  min="0"
                  step="0.1"
                  name="material_properties.density"
                  value={formData.material_properties.density.toString()}
                  onChange={e =>
                    handleChange(
                      'material_properties.density',
                      parseFloat(e.target.value)
                    )
                  }
                  error={errors['material_properties.density']}
                  readOnly={isReadOnly}
                  help="How dense the object is (affects mass distribution)"
                />
              </div>
            </div>
          </div>
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
    <div className="physics-object-modal">
      <div className="modal-header">
        <h2 className="modal-title">
          <Icon
            name={
              isDeleteMode ? 'delete' : formData.collision_shape || 'physics'
            }
            size="medium"
            className="modal-title-icon"
          />
          {modalTitle}
        </h2>
        {formData.name && !isCreateMode && (
          <div className="object-name">{formData.name}</div>
        )}
      </div>
      <div className="modal-content">{renderModalContent()}</div>
    </div>
  );
};

export default PhysicsObjectModal;
