import { Form, Input, InputNumber, message } from 'antd';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { SoundOutlined } from '../../components/common/Icons';
import Modal from '../../components/common/Modal';
import useModalManager from '../../hooks/useModalManager';
import {
  createPhysicsParameters,
  updatePhysicsParameters,
} from '../../store/slices/physicsParametersSlice';
import { mockApiResponse } from '../../utils/testUtils';

// Mock implementations for test mode
const mockDispatch = async (action, testMode = false) => {
  if (!testMode) return action;

  // For test mode, create a mock implementation
  console.log('TEST MODE: Mocking Redux dispatch for action:', action.type);

  // Wait a bit to simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));

  // Return a mock fulfilled result
  return {
    type: action.type + '/fulfilled',
    payload: {
      id: action.meta?.arg?.id || 'test-id-' + Date.now(),
      ...action.meta?.arg,
    },
  };
};

/**
 * PhysicsParametersModal Component
 * Modal for creating or editing physics parameters
 */
const PhysicsParametersModal = ({
  universeId,
  initialData = null,
  testMode = false,
  isGlobalModal = false,
  onClose = () => {},
  modalProps = {},
}) => {
  console.log('PhysicsParametersModal rendering with props:', {
    universeId,
    initialData,
    testMode,
    isGlobalModal,
    modalProps,
  });

  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { closeModal } = useModalManager();

  // Set initial form values when initialData changes
  useEffect(() => {
    if (initialData) {
      form.setFieldsValue({
        ...initialData,
      });
    }
  }, [form, initialData]);

  const handleSubmit = async values => {
    try {
      setLoading(true);
      setError(null);

      const actionPayload = {
        ...values,
        universeId,
      };

      if (initialData?.id) {
        actionPayload.id = initialData.id;
      }

      let result;
      if (testMode) {
        // Use mock implementation for test mode
        result = await mockDispatch(
          updatePhysicsParameters(actionPayload),
          true
        );
        await mockApiResponse(200);
      } else {
        // Use real Redux dispatch for production
        const action = initialData?.id
          ? updatePhysicsParameters(actionPayload)
          : createPhysicsParameters(actionPayload);
        result = await dispatch(action);
      }

      if (result.type.endsWith('/fulfilled')) {
        message.success(
          `Physics parameters ${
            initialData?.id ? 'updated' : 'created'
          } successfully!`
        );
        if (isGlobalModal) {
          closeModal();
        } else {
          onClose();
        }
      } else {
        throw new Error(
          result.error?.message || 'Failed to save physics parameters'
        );
      }
    } catch (err) {
      console.error('Error saving physics parameters:', err);
      setError(
        err.message || 'An error occurred while saving physics parameters'
      );
      message.error(err.message || 'Failed to save physics parameters');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (isGlobalModal) {
      closeModal();
    } else {
      onClose();
    }
  };

  return (
    <Modal
      title={
        initialData ? 'Edit Physics Parameters' : 'Create Physics Parameters'
      }
      open={true}
      onCancel={handleCancel}
      confirmLoading={loading}
      onOk={() => form.submit()}
      width={600}
      {...modalProps}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          gravity: 9.8,
          airResistance: 0.1,
          friction: 0.5,
          ...initialData,
        }}
      >
        {error && (
          <div
            className="error-message"
            style={{ color: 'red', marginBottom: 16 }}
          >
            {error}
          </div>
        )}

        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: 'Please enter a name' }]}
        >
          <Input placeholder="Enter a name for these physics parameters" />
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
            addonAfter={<SoundOutlined />}
          />
        </Form.Item>

        <Form.Item
          name="airResistance"
          label="Air Resistance"
          rules={[
            { required: true, message: 'Please enter air resistance value' },
          ]}
        >
          <InputNumber min={0} max={1} step={0.01} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="friction"
          label="Friction"
          rules={[{ required: true, message: 'Please enter friction value' }]}
        >
          <InputNumber min={0} max={1} step={0.01} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <Input.TextArea
            rows={4}
            placeholder="Enter a description for these physics parameters"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

PhysicsParametersModal.propTypes = {
  universeId: PropTypes.string,
  initialData: PropTypes.object,
  testMode: PropTypes.bool,
  isGlobalModal: PropTypes.bool,
  onClose: PropTypes.func,
  modalProps: PropTypes.object,
};

export default PhysicsParametersModal;
