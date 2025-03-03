import { App, Form, Input, InputNumber } from 'antd';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
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

const PhysicsParametersModal = ({
  universeId,
  initialData = null,
  testMode = false,
  onClose,
  isGlobalModal = false,
}) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const modalType = initialData
    ? 'edit-physics-parameters'
    : 'create-physics-parameters';

  // Prevent real API calls in test mode
  useEffect(() => {
    if (testMode) {
      console.log('PhysicsParametersModal is running in TEST MODE');
      console.log(
        'API calls will be mocked and no actual requests will be made'
      );
    }
  }, [testMode]);

  // Only use the modal manager if not in test mode and not in global modal
  const modalManager =
    testMode || isGlobalModal
      ? {
          loading: false,
          error: null,
          handleSubmit: async fn => {
            try {
              if (testMode) {
                // In test mode, don't actually dispatch actions to the API
                console.log('Test mode: Not sending actual API request');
                // Simulate successful validation but don't call API
                await form.validateFields();

                // Use App component to properly wrap message for theme context
                // or just use alert in test mode for simplicity
                alert(
                  `Physics parameters ${
                    initialData ? 'updated' : 'created'
                  } successfully (Test Mode)`
                );

                // Close the modal
                if (onClose) onClose();
              } else {
                // Normal operation for global modal mode
                await fn();
              }
            } catch (err) {
              console.error('Form submission error:', err);
              if (testMode) {
                alert(
                  `Error: ${
                    err.message || 'Failed to save physics parameters'
                  } (Test Mode)`
                );
              }
            }
          },
          isActive: true,
        }
      : useModalManager(modalType, {
          onSuccess: () => {
            // Use App component to properly wrap message for theme context
            const { message } = App.useApp();
            message.success(
              `Physics parameters ${
                initialData ? 'updated' : 'created'
              } successfully`
            );
          },
          onError: err => {
            // Use App component to properly wrap message for theme context
            const { message } = App.useApp();
            message.error(err.message || 'Failed to save physics parameters');
          },
        });

  const { loading, error, handleSubmit, isActive } = modalManager;

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();

      // In test mode, just log the values that would be sent and return a mock response
      if (testMode) {
        console.log('Test mode: Would send these values to API:', {
          ...values,
          universe_id: universeId,
        });

        // Mock a successful API response
        return await mockApiResponse({
          id: initialData?.id || 'mock-id-' + Date.now(),
          ...values,
          universe_id: universeId,
        });
      }

      const actionPayload = {
        ...values,
        universe_id: universeId,
      };

      const action = initialData
        ? updatePhysicsParameters({ id: initialData.id, ...actionPayload })
        : createPhysicsParameters(actionPayload);

      // Use the mock dispatch in test mode, otherwise use the real dispatch
      if (testMode) {
        return await mockDispatch(action, testMode);
      } else {
        return await dispatch(action).unwrap();
      }
    } catch (error) {
      console.error('Form submission error:', error);
      throw error;
    }
  };

  // Create a footer with save and cancel buttons
  const footerContent = (
    <div className="modal-footer-buttons">
      <button
        className="button button-primary"
        onClick={() => handleSubmit(handleFormSubmit)}
        disabled={loading}
      >
        {loading ? 'Saving...' : 'Save'}
      </button>
      <button className="button button-secondary" onClick={onClose}>
        Cancel
      </button>
    </div>
  );

  // Render modal content without the Modal wrapper when in test mode or global modal
  const modalContent = (
    <>
      {error && (
        <div
          className="error-message"
          style={{ marginBottom: 16, color: '#ff4d4f' }}
        >
          {error}
        </div>
      )}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFormSubmit}
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

        <Form.Item name="description" label="Description">
          <Input.TextArea placeholder="Enter description" />
        </Form.Item>

        <Form.Item
          name="gravity"
          label="Gravity (m/s²)"
          rules={[{ required: true, message: 'Please enter gravity value' }]}
        >
          <InputNumber min={0} max={100} step={0.1} style={{ width: '100%' }} />
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
          <InputNumber min={0} max={1} step={0.01} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="collision_elasticity"
          label="Collision Elasticity"
          rules={[
            { required: true, message: 'Please enter collision elasticity' },
          ]}
        >
          <InputNumber min={0} max={1} step={0.1} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="friction_coefficient"
          label="Friction Coefficient"
          rules={[
            { required: true, message: 'Please enter friction coefficient' },
          ]}
        >
          <InputNumber min={0} max={1} step={0.1} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="integration_method"
          label="Integration Method"
          rules={[
            { required: true, message: 'Please select integration method' },
          ]}
        >
          <Input placeholder="Enter integration method" />
        </Form.Item>

        <Form.Item
          name="constraint_iterations"
          label="Constraint Iterations"
          rules={[
            { required: true, message: 'Please enter constraint iterations' },
          ]}
        >
          <InputNumber min={1} max={50} style={{ width: '100%' }} />
        </Form.Item>

        {/* Add form buttons directly in the form when in test mode */}
        {(testMode || isGlobalModal) && (
          <div className="modal-footer-buttons" style={{ marginTop: '20px' }}>
            <button
              type="button"
              className="button button-primary"
              onClick={() => handleSubmit(handleFormSubmit)}
              disabled={loading}
              style={{
                padding: '8px 16px',
                backgroundColor: '#1890ff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '8px',
              }}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              className="button button-secondary"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f0f0f0',
                border: '1px solid #d9d9d9',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </Form>
    </>
  );

  // In test mode or when used in global modal, just return the content without the Modal wrapper
  if (testMode || isGlobalModal) {
    return modalContent;
  }

  // For normal usage, wrap in Modal
  return (
    <Modal
      isOpen={isActive}
      onClose={onClose}
      title={
        initialData ? 'Edit Physics Parameters' : 'Create Physics Parameters'
      }
      size="medium"
      type="form"
      animation="fade"
      position="center"
      footerContent={footerContent}
      contentClassName="physics-parameters-modal"
    >
      {modalContent}
    </Modal>
  );
};

PhysicsParametersModal.propTypes = {
  universeId: PropTypes.string.isRequired,
  initialData: PropTypes.object,
  testMode: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  isGlobalModal: PropTypes.bool,
};

export default PhysicsParametersModal;
