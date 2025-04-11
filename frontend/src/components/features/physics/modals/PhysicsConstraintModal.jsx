import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../../common/Button";
import Icon from "../../../../common/Icon";
import Input from "../../../../common/Input";
import Modal from "../../../../common/Modal";
import Spinner from "../../../../common/Spinner";
import "../styles/Modal.css";
import { API_CONFIG } from "../../../../utils/config";

/**
 * Modal for creating and editing physics constraints between objects.
 * @param {Object} props - Component props
 * @param {string} props.sceneId - ID of the scene
 * @param {Object} props.initialData - Initial data for editing
 * @param {Function} props.onClose - Function to call when the modal is closed
 * @param {Object} props.modalProps - Props for the Modal component
 * @param {boolean} props.isGlobalModal - Whether this modal is opened globally
 */
const PhysicsConstraintModal = ({
  sceneId,
  initialData,
  onClose,
  modalProps = {},
  isGlobalModal = false,
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(!!initialData?.id);
  const [error, setError] = useState(null);
  const [physicsObjects, setPhysicsObjects] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    type: "SPRING",
    object1_id: "",
    object2_id: "",
    parameters: {
      stiffness: 50,
      damping: 0.5,
      restLength: 100,
      breakForce: 1000,
    },
  });

  // Constraint types
  const constraintTypes = [
    { value: "SPRING", label: "Spring" },
    { value: "DISTANCE", label: "Distance" },
    { value: "HINGE", label: "Hinge" },
    { value: "POINT_TO_POINT", label: "Point to Point" },
  ];

  // Fetch physics objects and constraint data if editing
  useEffect(() => {
    const fetchPhysicsObjects = async () => {
      try {
        const response = await fetch(
          `/api/physics-objects?scene_id=${sceneId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch physics objects");
        }

        const data = await response.json();
        setPhysicsObjects(data);
      } catch (err) {
        setError(
          err.message || "An error occurred while fetching physics objects"
        );
      }
    };

    const fetchConstraintData = async () => {
      if (!initialData?.id) {
        setFetchLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/physics-constraints/${initialData.id}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch constraint data");
        }

        const data = await response.json();
        setFormData({
          name: data.name,
          type: data.type,
          object1_id: data.object1_id,
          object2_id: data.object2_id,
          parameters: data.parameters || {
            stiffness: 50,
            damping: 0.5,
            restLength: 100,
            breakForce: 1000,
          },
        });
      } catch (err) {
        setError(
          err.message || "An error occurred while fetching constraint data"
        );
      } finally {
        setFetchLoading(false);
      }
    };

    fetchPhysicsObjects();
    fetchConstraintData();
  }, [initialData, sceneId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleParameterChange = (e) => {
    const { name, value } = e.target;
    // All parameters should be numeric
    const numericValue = parseFloat(value);

    setFormData({
      ...formData,
      parameters: {
        ...formData.parameters,
        [name]: numericValue,
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate that two different objects are selected
      if (formData.object1_id === formData.object2_id) {
        throw new Error("A constraint must connect two different objects");
      }

      const url = initialData?.id
        ? `/api/physics-constraints/${initialData.id}`
        : `/api/physics-constraints`;

      const method = initialData?.id ? "PUT" : "POST";

      // Prepare data for API
      const apiData = {
        ...formData,
        scene_id: sceneId,
      };

      // Don't include IDs in the body for edit requests
      if (initialData?.id) {
        delete apiData.id;
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `Failed to ${
              initialData?.id ? "update" : "create"
            } physics constraint`
        );
      }

      // Close the modal and redirect if necessary
      onClose();

      if (isGlobalModal) {
        navigate(`/scenes/${sceneId}`);
      }
    } catch (err) {
      setError(
        err.message || "An error occurred while saving physics constraint"
      );
    } finally {
      setLoading(false);
    }
  };

  // Determine if we're creating or editing
  const isEditing = !!initialData?.id;

  // Show loading spinner while fetching existing data
  if (fetchLoading) {
    return (
      <Modal
        {...modalProps}
        onClose={onClose}
        className="physics-constraint-modal"
      >
        <div className="modal-body centered">
          <Spinner size="medium" />
          <p>Loading constraint data...</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      {...modalProps}
      onClose={onClose}
      className="physics-constraint-modal"
    >
      <div className="modal-header">
        <h2>
          {modalProps.title ||
            (isEditing
              ? "Edit Physics Constraint"
              : "Create Physics Constraint")}
        </h2>
      </div>

      <div className="modal-body">
        {error && <div className="error-message">{error}</div>}

        {physicsObjects.length < 2 ? (
          <div className="warning-message">
            You need at least two physics objects in this scene to create a
            constraint.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Constraint Name</label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter a name for this constraint"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="type">Constraint Type</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="form-control"
                required
              >
                {constraintTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="object1_id">First Object</label>
                <select
                  id="object1_id"
                  name="object1_id"
                  value={formData.object1_id}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                >
                  <option value="">Select an object</option>
                  {physicsObjects.map((obj) => (
                    <option key={obj.id} value={obj.id}>
                      {obj.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="object2_id">Second Object</label>
                <select
                  id="object2_id"
                  name="object2_id"
                  value={formData.object2_id}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                >
                  <option value="">Select an object</option>
                  {physicsObjects.map((obj) => (
                    <option key={obj.id} value={obj.id}>
                      {obj.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <fieldset className="parameters-fieldset">
              <legend>Constraint Parameters</legend>

              {formData.type === "SPRING" && (
                <>
                  <div className="form-group">
                    <label htmlFor="stiffness">Stiffness</label>
                    <Input
                      id="stiffness"
                      name="stiffness"
                      type="number"
                      min="1"
                      max="1000"
                      value={formData.parameters.stiffness}
                      onChange={handleParameterChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="damping">Damping</label>
                    <Input
                      id="damping"
                      name="damping"
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      value={formData.parameters.damping}
                      onChange={handleParameterChange}
                      required
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label htmlFor="restLength">Rest Length</label>
                <Input
                  id="restLength"
                  name="restLength"
                  type="number"
                  min="1"
                  max="1000"
                  value={formData.parameters.restLength}
                  onChange={handleParameterChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="breakForce">Break Force</label>
                <Input
                  id="breakForce"
                  name="breakForce"
                  type="number"
                  min="0"
                  max="10000"
                  value={formData.parameters.breakForce}
                  onChange={handleParameterChange}
                  required
                />
                <small className="help-text">
                  Set to 0 for an unbreakable constraint
                </small>
              </div>
            </fieldset>

            <div className="form-actions">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading || physicsObjects.length < 2}
              >
                {loading ? (
                  <Spinner size="small" />
                ) : isEditing ? (
                  "Save Changes"
                ) : (
                  "Create Constraint"
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};

PhysicsConstraintModal.propTypes = {
  sceneId: PropTypes.string.isRequired,
  initialData: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  modalProps: PropTypes.object,
  isGlobalModal: PropTypes.bool,
};

export default PhysicsConstraintModal;
