import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from '../../../components/common/Button.jsx';
import Icon from '../../../components/common/Icon.jsx';
import { MODAL_TYPES } from '../../../constants/modalTypes';
import { useModalState } from '../../../hooks/useModalState';
import { fetchPhysicsObjects } from '../../../store/thunks/physicsObjectsThunks';
import '../styles/PhysicsObjects.css';
import PhysicsObjectsList from './PhysicsObjectsList';

const PhysicsObjectsManager = ({ sceneId }) => {
  const dispatch = useDispatch();
  const { open } = useModalState();
  const { physicsObjects, loading, error } = useSelector((state) => state.physicsObjects);

  useEffect(() => {
    if (sceneId) {
      dispatch(fetchPhysicsObjects(sceneId));
    }
  }, [dispatch, sceneId]);

  const handleAddPhysicsObject = () => {
    open('PHYSICS_OBJECT', {
      sceneId,
      title: 'Add Physics Object',
      onSave: () => {
        dispatch(fetchPhysicsObjects(sceneId));
      },
    });
  };

  const handleEditPhysicsObject = (object) => {
    open('PHYSICS_OBJECT', {
      sceneId,
      objectId: object.id,
      initialData: object,
      title: 'Edit Physics Object',
      onSave: () => {
        dispatch(fetchPhysicsObjects(sceneId));
      },
    });
  };

  const handleViewObject = (objectId) => {
    const objectToView = physicsObjects.find((obj) => obj.id === objectId);

    open(MODAL_TYPES.PHYSICS_OBJECT, {
      sceneId,
      objectId,
      initialData: objectToView,
      readOnly: true,
    });
  };

  const handleDeleteObject = (objectId) => {
    const objectToDelete = physicsObjects.find((obj) => obj.id === objectId);

    if (!objectToDelete) {
      console.error(`Physics object with ID ${objectId} not found`);
      return;
    }

    open(MODAL_TYPES.CONFIRM_DELETE, {
      entityType: 'physics object',
      entityId: objectId,
      entityName: objectToDelete.name,
      onConfirm: () => {
        dispatch(fetchPhysicsObjects(sceneId));
      },
    });
  };

  const refreshPhysicsObjects = () => {
    dispatch(fetchPhysicsObjects(sceneId));
  };

  return (
    <div className="physics-objects-manager">
      <div className="physics-objects-header">
        <h2 className="physics-objects-title">
          <Icon name="physics" size="medium" className="title-icon" />
          Physics Objects
        </h2>
        <div className="physics-objects-actions">
          <Button
            onClick={refreshPhysicsObjects}
            variant="icon"
            title="Refresh physics objects list"
          >
            <Icon name="refresh" size="medium" />
          </Button>
          <Button onClick={handleAddPhysicsObject} variant="primary">
            <Icon name="add" size="small" />
            Add Object
          </Button>
        </div>
      </div>

      <PhysicsObjectsList
        sceneId={sceneId}
        objects={physicsObjects}
        loading={loading}
        error={error}
        onViewClick={handleViewObject}
        onEditClick={handleEditPhysicsObject}
        onDeleteClick={handleDeleteObject}
        onCreateClick={handleAddPhysicsObject}
      />
    </div>
  );
};

PhysicsObjectsManager.propTypes = {
  sceneId: PropTypes.string.isRequired,
};

export default PhysicsObjectsManager;
