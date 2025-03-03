import { Form, Input, InputNumber, Select, Slider } from 'antd';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import Button from '../../components/common/Button';
import { createScene, updateScene } from '../../store/thunks/scenesThunks';

const { TextArea } = Input;
const { Option } = Select;

/**
 * Modal form for creating and editing scenes
 */
const SceneFormModal = ({
  universeId,
  sceneId,
  initialData = null,
  onClose,
  isGlobalModal = false,
}) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const isEditing = !!sceneId;

  // Set form values when initialData changes
  useEffect(() => {
    if (initialData) {
      form.setFieldsValue({
        name: initialData.name,
        description: initialData.description,
        type: initialData.type || 'standard',
        duration: initialData.duration || 60,
        complexity: initialData.complexity || 5,
        order: initialData.order || 1,
      });
    }
  }, [initialData, form]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      const sceneData = {
        name: values.name,
        description: values.description,
        type: values.type,
        duration: values.duration,
        complexity: values.complexity,
        order: values.order,
        universe_id: universeId,
      };

      if (isEditing) {
        await dispatch(updateScene({ id: sceneId, ...sceneData }));
      } else {
        await dispatch(createScene(sceneData));
      }

      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="scene-form-modal">
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          name: '',
          description: '',
          type: 'standard',
          duration: 60,
          complexity: 5,
          order: 1,
        }}
      >
        <Form.Item
          name="name"
          label="Scene Name"
          rules={[
            { required: true, message: 'Please enter a name for your scene' },
          ]}
        >
          <Input placeholder="Enter scene name" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
          rules={[{ required: true, message: 'Please enter a description' }]}
        >
          <TextArea
            placeholder="Describe your scene"
            autoSize={{ minRows: 3, maxRows: 6 }}
          />
        </Form.Item>

        <Form.Item
          name="type"
          label="Scene Type"
          rules={[{ required: true, message: 'Please select a scene type' }]}
        >
          <Select placeholder="Select a scene type">
            <Option value="standard">Standard</Option>
            <Option value="intro">Introduction</Option>
            <Option value="climax">Climax</Option>
            <Option value="transition">Transition</Option>
            <Option value="finale">Finale</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="duration"
          label="Duration (seconds)"
          rules={[{ required: true, message: 'Please specify a duration' }]}
        >
          <InputNumber min={10} max={300} step={5} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="complexity"
          label="Complexity"
          rules={[{ required: true, message: 'Please specify complexity' }]}
        >
          <Slider min={1} max={10} marks={{ 1: '1', 5: '5', 10: '10' }} />
        </Form.Item>

        <Form.Item
          name="order"
          label="Order"
          rules={[{ required: true, message: 'Please specify the order' }]}
        >
          <InputNumber min={1} max={100} style={{ width: '100%' }} />
        </Form.Item>

        <div className="form-actions">
          <Button type="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="primary" onClick={handleSubmit} loading={loading}>
            {isEditing ? 'Update Scene' : 'Create Scene'}
          </Button>
        </div>
      </Form>
    </div>
  );
};

SceneFormModal.propTypes = {
  universeId: PropTypes.string.isRequired,
  sceneId: PropTypes.string,
  initialData: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  isGlobalModal: PropTypes.bool,
};

export default SceneFormModal;
