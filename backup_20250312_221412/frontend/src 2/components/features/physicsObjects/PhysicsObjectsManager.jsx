import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useModal } from '../../../contexts/ModalContext';
import { fetchPhysicsObjects } from '../../../store/thunks/physicsObjectsThunks';
import Button from '../../common/Button';
import Icon from '../../common/Icon';
import PhysicsObjectModal from './PhysicsObjectModal';
import './PhysicsObjects.css';
import PhysicsObjectsList from './PhysicsObjectsList';

const PhysicsObjectsManager = ({ sceneId }) => {
  const dispatch = useDispatch();
  const { openModal } = useModal();
  const { physicsObjects, loading, error } = useSelector(
    state => state.physicsObjects
  );

  useEffect(() => {
    if (sceneId) {
      dispatch(fetchPhysicsObjects(sceneId));
    }
  }, [dispatch, sceneId]);

  const handleAddObject = () => {
    openModal({
      component: PhysicsObjectModal,
      props: {
        sceneId,
        mode: 'create',
        onSuccess: () => {
          dispatch(fetchPhysicsObjects(sceneId));
        },
      },
      modalProps: {
        title: 'Create Physics Object',
        size: 'large',
        animation: 'slide',
        position: 'center',
      },
    });
  };

  const handleEditObject = objectId => {
    const objectToEdit = physicsObjects.find(obj => obj.id === objectId);

    openModal({
      component: PhysicsObjectModal,
      props: {
        sceneId,
        objectId,
        initialData: objectToEdit,
        mode: 'edit',
        onSuccess: () => {
          dispatch(fetchPhysicsObjects(sceneId));
        },
      },
      modalProps: {
        title: 'Edit Physics Object',
        size: 'large',
        animation: 'slide',
        position: 'center',
      },
    });
  };

  const handleViewObject = objectId => {
    const objectToView = physicsObjects.find(obj => obj.id === objectId);

    openModal({
      component: PhysicsObjectModal,
      props: {
        sceneId,
        objectId,
        initialData: objectToView,
        mode: 'view',
      },
      modalProps: {
        title: 'View Physics Object',
        size: 'large',
        animation: 'fade',
        position: 'center',
      },
    });
  };

  const handleDeleteObject = objectId => {
    const objectToDelete = physicsObjects.find(obj => obj.id === objectId);

    if (!objectToDelete) {
      console.error(`Physics object with ID ${objectId} not found`);
      return;
    }

    openModal({
      component: PhysicsObjectModal,
      props: {
        sceneId,
        objectId,
        initialData: objectToDelete,
        mode: 'delete',
        onSuccess: () => {
          dispatch(fetchPhysicsObjects(sceneId));
        },
      },
      modalProps: {
        title: 'Delete Physics Object',
        size: 'medium',
        animation: 'zoom',
        position: 'center',
        preventBackdropClick: true,
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
          <Button onClick={handleAddObject} variant="primary">
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
        onEditClick={handleEditObject}
        onDeleteClick={handleDeleteObject}
        onCreateClick={handleAddObject}
      />
    </div>
  );
};

export default PhysicsObjectsManager;
