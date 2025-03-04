import React, { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Modal, Form, Input, InputNumber } from 'antd';
import { createScene, updateScene } from '../../store/thunks/scenesThunks';
import Spinner from '../../components/common/Spinner';
import './SceneFormModal.css';

const SceneFormModal = ({ universeId, sceneId, initialData, onClose, isCreating }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.scenes);
  const [form] = Form.useForm();
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Initialize form with initialData
  useEffect(() => {
    if (initialData) {
      form.setFieldsValue({
        name: initialData.name,
        description: initialData.description,
        scene_order: initialData.scene_order || 0
      });
    } else {
      form.resetFields();
    }
  }, [initialData, form]);

  // Map API errors to form fields
  useEffect(() => {
    if (error && typeof error === 'object') {
      const newErrors = {};

      // Process validation errors
      if (error.errors && typeof error.errors === 'object') {
        Object.entries(error.errors).forEach(([field, messages]) => {
          newErrors[field] = Array.isArray(messages) ? messages[0] : messages;
        });
      }

      // Process general error
      if (error.message) {
        newErrors.general = error.message;
      }

      setFormErrors(newErrors);
      setSubmitting(false);
    } else if (error && typeof error === 'string') {
      setFormErrors({ general: error });
      setSubmitting(false);
    }
  }, [error]);

  const handleSubmit = useCallback(async (values) => {
    setSubmitting(true);
    setFormErrors({});

    try {
      if (isCreating) {
        await dispatch(createScene({ universeId, ...values })).unwrap();
      } else {
        await dispatch(updateScene({
          sceneId,
          data: values
        })).unwrap();
      }
      onClose();
    } catch (err) {
      // Error handling is done in the useEffect above
      console.error('Form submission error:', err);
    }
  }, [dispatch, universeId, sceneId, isCreating, onClose]);

  const handleCancel = useCallback(() => {
    form.resetFields();
    onClose();
  }, [form, onClose]);

  return (
    <Modal
      title={isCreating ? 'Create New Scene' : 'Edit Scene'}
      open={true}
      onCancel={handleCancel}
      footer={null}
      width={600}
      maskClosable={false}
      className="scene-form-modal"
    >
      <div className="scene-form-container">
        {formErrors.general && (
          <div className="form-error-message">{formErrors.general}</div>
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}
          className="scene-form"
        >
          <Form.Item
            name="name"
            label="Scene Name"
            rules={[{ required: true, message: 'Please enter a name for the scene' }]}
            validateStatus={formErrors.name ? 'error' : ''}
            help={formErrors.name}
          >
            <Input placeholder="Enter scene name" maxLength={100} />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            validateStatus={formErrors.description ? 'error' : ''}
            help={formErrors.description}
          >
            <Input.TextArea
              placeholder="Enter scene description"
              rows={4}
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="scene_order"
            label="Scene Order"
            validateStatus={formErrors.scene_order ? 'error' : ''}
            help={formErrors.scene_order}
          >
            <InputNumber
              placeholder="Order position"
              min={0}
              step={1}
              className="scene-order-input"
            />
          </Form.Item>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={handleCancel}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Spinner size="small" />
                  <span>{isCreating ? 'Creating...' : 'Saving...'}</span>
                </>
              ) : (
                isCreating ? 'Create Scene' : 'Save Changes'
              )}
            </button>
          </div>
        </Form>
      </div>
    </Modal>
  );
};

export default SceneFormModal;
