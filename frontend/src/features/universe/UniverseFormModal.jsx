import { Form, Input, Select } from 'antd';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import Button from '../../components/common/Button';
import {
  createUniverse,
  updateUniverse,
} from '../../store/thunks/universeThunks';

const { TextArea } = Input;
const { Option } = Select;

/**
 * Modal form for creating and editing universes
 */
const UniverseFormModal = ({
  universeId,
  initialData = null,
  onClose,
  isGlobalModal = false,
}) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const isEditing = !!universeId;

  // Set form values when initialData changes
  useEffect(() => {
    if (initialData) {
      form.setFieldsValue({
        name: initialData.name,
        description: initialData.description,
        theme: initialData.theme || 'cosmic',
        visibility: initialData.visibility || 'private',
      });
    }
  }, [initialData, form]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      const universeData = {
        name: values.name,
        description: values.description,
        theme: values.theme,
        visibility: values.visibility,
      };

      if (isEditing) {
        await dispatch(updateUniverse({ id: universeId, ...universeData }));
      } else {
        await dispatch(createUniverse(universeData));
      }

      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="universe-form-modal">
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          name: '',
          description: '',
          theme: 'cosmic',
          visibility: 'private',
        }}
      >
        <Form.Item
          name="name"
          label="Universe Name"
          rules={[
            {
              required: true,
              message: 'Please enter a name for your universe',
            },
          ]}
        >
          <Input placeholder="Enter universe name" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
          rules={[{ required: true, message: 'Please enter a description' }]}
        >
          <TextArea
            placeholder="Describe your universe"
            autoSize={{ minRows: 3, maxRows: 6 }}
          />
        </Form.Item>

        <Form.Item
          name="theme"
          label="Theme"
          rules={[{ required: true, message: 'Please select a theme' }]}
        >
          <Select placeholder="Select a theme">
            <Option value="cosmic">Cosmic</Option>
            <Option value="quantum">Quantum</Option>
            <Option value="elemental">Elemental</Option>
            <Option value="mythical">Mythical</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="visibility"
          label="Visibility"
          rules={[{ required: true, message: 'Please select visibility' }]}
        >
          <Select placeholder="Select visibility">
            <Option value="private">Private</Option>
            <Option value="public">Public</Option>
            <Option value="shared">Shared</Option>
          </Select>
        </Form.Item>

        <div className="form-actions">
          <Button type="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="primary" onClick={handleSubmit} loading={loading}>
            {isEditing ? 'Update Universe' : 'Create Universe'}
          </Button>
        </div>
      </Form>
    </div>
  );
};

UniverseFormModal.propTypes = {
  universeId: PropTypes.string,
  initialData: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  isGlobalModal: PropTypes.bool,
};

export default UniverseFormModal;
