import { Form, Input, InputNumber, Select, Slider, Switch } from 'antd';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import Button from '../../components/common/Button';
import {
  createPhysicsObject,
  updatePhysicsObject,
} from '../../store/thunks/physicsObjectsThunks';

const { TextArea } = Input;
const { Option } = Select;

/**
 * Modal form for creating and editing physics objects
 */
const PhysicsObjectFormModal = ({
  sceneId,
  initialData = null,
  onClose,
  isGlobalModal = false,
}) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const isEditing = !!initialData;
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Set form values when initialData changes
  useEffect(() => {
    if (initialData) {
      form.setFieldsValue({
        name: initialData.name,
        description: initialData.description,
        type: initialData.type || 'particle',
        mass: initialData.mass || 1.0,
        radius: initialData.radius || 1.0,
        position_x: initialData.position_x || 0,
        position_y: initialData.position_y || 0,
        position_z: initialData.position_z || 0,
        velocity_x: initialData.velocity_x || 0,
        velocity_y: initialData.velocity_y || 0,
        velocity_z: initialData.velocity_z || 0,
        color: initialData.color || '#1890ff',
        is_fixed: initialData.is_fixed || false,
        elasticity: initialData.elasticity || 0.8,
      });
    }
  }, [initialData, form]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      const objectData = {
        name: values.name,
        description: values.description,
        type: values.type,
        mass: values.mass,
        radius: values.radius,
        position_x: values.position_x,
        position_y: values.position_y,
        position_z: values.position_z,
        velocity_x: values.velocity_x,
        velocity_y: values.velocity_y,
        velocity_z: values.velocity_z,
        color: values.color,
        is_fixed: values.is_fixed,
        elasticity: values.elasticity,
        scene_id: sceneId,
      };

      if (isEditing) {
        await dispatch(
          updatePhysicsObject({ id: initialData.id, ...objectData })
        );
      } else {
        await dispatch(createPhysicsObject(objectData));
      }

      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="physics-object-form-modal">
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          name: '',
          description: '',
          type: 'particle',
          mass: 1.0,
          radius: 1.0,
          position_x: 0,
          position_y: 0,
          position_z: 0,
          velocity_x: 0,
          velocity_y: 0,
          velocity_z: 0,
          color: '#1890ff',
          is_fixed: false,
          elasticity: 0.8,
        }}
      >
        <Form.Item
          name="name"
          label="Object Name"
          rules={[
            { required: true, message: 'Please enter a name for this object' },
          ]}
        >
          <Input placeholder="Enter object name" />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <TextArea
            placeholder="Describe this physics object"
            autoSize={{ minRows: 2, maxRows: 4 }}
          />
        </Form.Item>

        <Form.Item
          name="type"
          label="Object Type"
          rules={[{ required: true, message: 'Please select an object type' }]}
        >
          <Select placeholder="Select object type">
            <Option value="particle">Particle</Option>
            <Option value="planet">Planet</Option>
            <Option value="star">Star</Option>
            <Option value="asteroid">Asteroid</Option>
            <Option value="blackhole">Black Hole</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="mass"
          label="Mass"
          rules={[{ required: true, message: 'Please specify mass' }]}
        >
          <InputNumber
            min={0.1}
            max={1000}
            step={0.1}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          name="radius"
          label="Radius"
          rules={[{ required: true, message: 'Please specify radius' }]}
        >
          <InputNumber
            min={0.1}
            max={100}
            step={0.1}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item name="color" label="Color">
          <Input type="color" style={{ width: '100%', height: '32px' }} />
        </Form.Item>

        <Form.Item
          name="is_fixed"
          label="Fixed Position"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <div className="advanced-toggle">
          <Button type="text" onClick={() => setShowAdvanced(!showAdvanced)}>
            {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
          </Button>
        </div>

        {showAdvanced && (
          <div className="advanced-options">
            <h4>Position</h4>
            <div className="position-inputs">
              <Form.Item name="position_x" label="X">
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="position_y" label="Y">
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="position_z" label="Z">
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </div>

            <h4>Velocity</h4>
            <div className="velocity-inputs">
              <Form.Item name="velocity_x" label="X">
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="velocity_y" label="Y">
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="velocity_z" label="Z">
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </div>

            <Form.Item name="elasticity" label="Elasticity">
              <Slider
                min={0}
                max={1}
                step={0.1}
                marks={{ 0: '0', 0.5: '0.5', 1: '1' }}
              />
            </Form.Item>
          </div>
        )}

        <div className="form-actions">
          <Button type="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="primary" onClick={handleSubmit} loading={loading}>
            {isEditing ? 'Update Object' : 'Create Object'}
          </Button>
        </div>
      </Form>
    </div>
  );
};

PhysicsObjectFormModal.propTypes = {
  sceneId: PropTypes.string.isRequired,
  initialData: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  isGlobalModal: PropTypes.bool,
};

export default PhysicsObjectFormModal;
