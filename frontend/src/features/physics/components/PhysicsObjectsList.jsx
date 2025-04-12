import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import { motion, AnimatePresence } from "framer-motion";
import "../styles/PhysicsObjects.css";
import { fetchPhysicsObjects } from "../../../store/thunks/physicsObjectsThunks";
import { Button } from "../../../components/common";
import Icon from "../../../components/common/Icon";
import Spinner from "../../../components/common/Spinner";
import { setCurrentPhysicsObject } from "../../../store/slices/physicsObjectsSlice";

const PhysicsObjectsList = ({
  sceneId,
  onViewClick,
  onEditClick,
  onDeleteClick,
  onCreateClick,
}) => {
  const dispatch = useDispatch();
  const { physicsObjects, loading, error } = useSelector((state) => state.physicsObjects);

  useEffect(() => {
    if (sceneId) {
      dispatch(fetchPhysicsObjects(sceneId));
    }
  }, [sceneId, dispatch]);

  const handleViewClick = (physicsObject) => {
    dispatch(setCurrentPhysicsObject(physicsObject));
    if (onViewClick) onViewClick(physicsObject);
  };

  const handleEditClick = (physicsObject) => {
    dispatch(setCurrentPhysicsObject(physicsObject));
    if (onEditClick) onEditClick(physicsObject);
  };

  const handleDeleteClick = (physicsObject) => {
    if (onDeleteClick) onDeleteClick(physicsObject);
  };

  const getCollisionShapeClass = (shape) => {
    const classes = {
      box: "shape-box",
      sphere: "shape-sphere",
      capsule: "shape-capsule",
      cylinder: "shape-cylinder",
      cone: "shape-cone",
      plane: "shape-plane",
    };
    return classes[shape] || "shape-default";
  };

  if (error) {
    return (
      <div className="physics-objects-list">
        <div className="error-message">
          <Icon name="error" size="medium" />
          Error loading physics objects: {error.message}
          <Button
            variant="secondary"
            onClick={() => dispatch(fetchPhysicsObjects(sceneId))}
            className="retry-button"
          >
            <Icon name="refresh" size="small" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="physics-objects-list">
      <div className="physics-objects-list-content">
        <div className="physics-objects-header">
          <h2 className="physics-objects-title">
            <Icon name="physics" size="medium" className="title-icon" />
            Physics Objects
          </h2>
          <Button variant="primary" onClick={onCreateClick}>
            <Icon name="add" size="small" />
            Add Object
          </Button>
        </div>

        {loading ? (
          <div className="loading-container">
            <Spinner size="medium" />
            <p>Loading physics objects...</p>
          </div>
        ) : physicsObjects.length === 0 ? (
          <div className="empty-state">
            <Icon name="empty" size="large" className="empty-icon" />
            <p>No physics objects yet</p>
            <Button variant="secondary" onClick={onCreateClick}>
              <Icon name="add" size="small" />
              Create your first physics object
            </Button>
          </div>
        ) : (
          <div className="physics-objects-items">
            {physicsObjects.map((item) => (
              <div key={item.id} className="physics-object-item">
                <div className="physics-object-item-header">
                  <h3 className="physics-object-name">
                    <Icon
                      name={item.collision_shape || "default"}
                      size="small"
                      className="object-icon"
                    />
                    {item.name}
                  </h3>
                  <div className="physics-object-actions">
                    <Button
                      variant="icon"
                      onClick={() => handleViewClick(item)}
                      aria-label="View physics object details"
                      title="View details"
                    >
                      <Icon name="view" size="medium" />
                    </Button>
                    <Button
                      variant="icon"
                      onClick={() => handleEditClick(item)}
                      aria-label="Edit physics object"
                      title="Edit object"
                    >
                      <Icon name="edit" size="medium" />
                    </Button>
                    <Button
                      variant="icon-danger"
                      onClick={() => handleDeleteClick(item)}
                      aria-label="Delete physics object"
                      title="Delete object"
                    >
                      <Icon name="delete" size="medium" />
                    </Button>
                  </div>
                </div>

                <div className="physics-object-badges">
                  <span
                    className={`badge ${
                      item.is_static ? "badge-static" : "badge-dynamic"
                    }`}
                    title={
                      item.is_static
                        ? "Static objects don't move"
                        : "Dynamic objects respond to forces"
                    }
                  >
                    {item.is_static ? "Static" : "Dynamic"}
                  </span>
                  <span
                    className={`badge ${getCollisionShapeClass(
                      item.collision_shape
                    )}`}
                    title={`Collision shape: ${item.collision_shape}`}
                  >
                    {item.collision_shape}
                  </span>
                  {item.is_trigger && (
                    <span
                      className="badge badge-trigger"
                      title="Trigger objects detect collisions but don't physically interact"
                    >
                      Trigger
                    </span>
                  )}
                </div>

                <div className="physics-object-properties">
                  <div className="physics-object-property">
                    <span className="property-label">Mass:</span>
                    <span className="property-value">{item.mass} kg</span>
                  </div>
                  <div className="physics-object-property">
                    <span className="property-label">Position:</span>
                    <span className="property-value">
                      ({item.position.x.toFixed(2)},{" "}
                      {item.position.y.toFixed(2)}, {item.position.z.toFixed(2)}
                      )
                    </span>
                  </div>
                  <div className="physics-object-property">
                    <span className="property-label">Velocity:</span>
                    <span className="property-value">
                      ({item.velocity.x.toFixed(2)},{" "}
                      {item.velocity.y.toFixed(2)}, {item.velocity.z.toFixed(2)}
                      )
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

PhysicsObjectsList.propTypes = {
  sceneId: PropTypes.string.isRequired,
  onViewClick: PropTypes.func,
  onEditClick: PropTypes.func,
  onDeleteClick: PropTypes.func,
  onCreateClick: PropTypes.func,
};

export default PhysicsObjectsList;
