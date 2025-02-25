import { ExclamationCircleOutlined } from '@ant-design/icons';
import { message, Modal } from 'antd';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { clearCurrentPhysicsObject } from '../../../store/slices/physicsObjectsSlice';
import { deletePhysicsObject } from '../../../store/thunks/physicsObjectsThunks';
import '../scenes/Scenes.css';
import PhysicsObjectForm from './PhysicsObjectForm';
import PhysicsObjectsList from './PhysicsObjectsList';

const { confirm } = Modal;

const PhysicsObjectsManager = ({ sceneId }) => {
  const dispatch = useDispatch();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Handle create button click
  const handleCreateClick = () => {
    dispatch(clearCurrentPhysicsObject());
    setIsEditing(false);
    setIsFormVisible(true);
  };

  // Handle edit button click
  const handleEditClick = physicsObject => {
    setIsEditing(true);
    setIsFormVisible(true);
  };

  // Handle delete button click
  const handleDeleteClick = physicsObject => {
    confirm({
      title: 'Delete Physics Object',
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to delete "${physicsObject.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        const result = await dispatch(deletePhysicsObject(physicsObject.id));
        if (!result.error) {
          message.success('Physics object deleted successfully');
        } else {
          message.error(
            `Failed to delete physics object: ${result.error.message}`
          );
        }
      },
    });
  };

  // Handle form success
  const handleFormSuccess = () => {
    setIsFormVisible(false);
    message.success(
      isEditing ? 'Physics object updated' : 'Physics object created'
    );
  };

  // Handle form cancel
  const handleFormCancel = () => {
    setIsFormVisible(false);
  };

  return (
    <div className="physics-objects-manager">
      {/* Physics Objects List */}
      <PhysicsObjectsList
        sceneId={sceneId}
        onCreateClick={handleCreateClick}
        onEditClick={handleEditClick}
        onDeleteClick={handleDeleteClick}
      />

      {/* Form Modal */}
      <Modal
        open={isFormVisible}
        onCancel={handleFormCancel}
        footer={null}
        width={800}
        destroyOnClose
        title={isEditing ? 'Edit Physics Object' : 'Create Physics Object'}
      >
        <PhysicsObjectForm
          sceneId={sceneId}
          isEdit={isEditing}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      </Modal>
    </div>
  );
};

export default PhysicsObjectsManager;
