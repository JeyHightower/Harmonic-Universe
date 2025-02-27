import React from 'react';
import PropTypes from 'prop-types';
import { Form, Input, InputNumber, message } from 'antd';
import { useDispatch } from 'react-redux';
import BaseModal from '../../components/common/BaseModal';
import useModalManager from '../../hooks/useModalManager';
import { createPhysicsParameters, updatePhysicsParameters } from '../../store/slices/physicsParametersSlice';

const PhysicsParametersModal = ({ universeId, initialData = null }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const modalType = initialData ? 'edit-physics-parameters' : 'create-physics-parameters';

  const { loading, error, handleSubmit, closeModal, isActive } = useModalManager(modalType, {
    onSuccess: () => {
      message.success(`Physics parameters ${initialData ? 'updated' : 'created'} successfully`);
    },
    onError: (err) => {
      message.error(err.message || 'Failed to save physics parameters');
    },
  });

  const handleFormSubmit = async () => {
    const values = await form.validateFields();
    const actionPayload = {
      ...values,
      universe_id: universeId,
    };

    const action = initialData
      ? updatePhysicsParameters({ id: initialData.id, ...actionPayload })
      : createPhysicsParameters(actionPayload);

    await dispatch(action).unwrap();
  };

  return (
    <BaseModal
      title={initialData ? 'Edit Physics Parameters' : 'Create Physics Parameters'}
      visible={isActive}
      onOk={() => handleSubmit(handleFormSubmit)}
      onCancel={closeModal}
      confirmLoading={loading}
      modalType="form"
      width={600}
    >
      {error && (
        <div className="error-message" style={{ marginBottom: 16, color: '#ff4d4f' }}>
          {error}
        </div>
      )}

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          gravity: 9.81,
          time_scale: 1.0,
          air_resistance: 0.0,
          collision_elasticity: 1.0,
          friction_coefficient: 0.5,
          integration_method: 'verlet',
          constraint_iterations: 10,
          ...initialData,
        }}
      >
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: 'Please enter a name' }]}
        >
          <Input placeholder="Enter parameter set name" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
        >
          <Input.TextArea placeholder="Enter description" />
        </Form.Item>

        <Form.Item
          name="gravity"
          label="Gravity (m/s²)"
          rules={[{ required: true, message: 'Please enter gravity value' }]}
        >
          <InputNumber
            min={0}
            max={100}
            step={0.1}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          name="time_scale"
          label="Time Scale"
          rules={[{ required: true, message: 'Please enter time scale' }]}
        >
          <InputNumber
            min={0.1}
            max={10}
            step={0.1}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          name="air_resistance"
          label="Air Resistance"
          rules={[{ required: true, message: 'Please enter air resistance' }]}
        >
          <InputNumber
            min={0}
            max={1}
            step={0.01}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          name="collision_elasticity"
          label="Collision Elasticity"
          rules={[{ required: true, message: 'Please enter collision elasticity' }]}
        >
          <InputNumber
            min={0}
            max={1}
            step={0.1}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          name="friction_coefficient"
          label="Friction Coefficient"
          rules={[{ required: true, message: 'Please enter friction coefficient' }]}
        >
          <InputNumber
            min={0}
            max={1}
            step={0.1}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          name="integration_method"
          label="Integration Method"
          rules={[{ required: true, message: 'Please select integration method' }]}
        >
          <Input placeholder="Enter integration method" />
        </Form.Item>

        <Form.Item
          name="constraint_iterations"
          label="Constraint Iterations"
          rules={[{ required: true, message: 'Please enter constraint iterations' }]}
        >
          <InputNumber
            min={1}
            max={50}
            style={{ width: '100%' }}
          />
        </Form.Item>
      </Form>
    </BaseModal>
  );
};

PhysicsParametersModal.propTypes = {
  universeId: PropTypes.string.isRequired,
  initialData: PropTypes.object,
};

export default PhysicsParametersModal;
