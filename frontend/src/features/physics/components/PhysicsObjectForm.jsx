/**
 * DEPRECATED: This component is currently not imported or used anywhere in the application.
 * It is being kept for reference or potential future use.
 *
 * If you need to use this component, please review and update it according to current application standards.
 * Consider using standard form patterns from the application.
 */

import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Switch,
  Typography,
} from "antd";
import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import { createPhysicsObject, updatePhysicsObject } from "../../../store/thunks/physicsObjectsThunks";

const { Option } = Select;
const { Title } = Typography;

const PhysicsObjectForm = ({
  sceneId,
  onSuccess,
  onCancel,
  isEdit = false,
}) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const { currentPhysicsObject, loading } = useSelector(
    (state) => state.physicsObjects
  );

  // Initialize form values when editing
  useEffect(() => {
    if (isEdit && currentPhysicsObject) {
      form.setFieldsValue({
        name: currentPhysicsObject.name,
        mass: currentPhysicsObject.mass,
        is_static: currentPhysicsObject.is_static,
        is_trigger: currentPhysicsObject.is_trigger,
        collision_shape: currentPhysicsObject.collision_shape,
        position_x: currentPhysicsObject.position.x,
        position_y: currentPhysicsObject.position.y,
        position_z: currentPhysicsObject.position.z,
        velocity_x: currentPhysicsObject.velocity.x,
        velocity_y: currentPhysicsObject.velocity.y,
        velocity_z: currentPhysicsObject.velocity.z,
        rotation_x: currentPhysicsObject.rotation.x,
        rotation_y: currentPhysicsObject.rotation.y,
        rotation_z: currentPhysicsObject.rotation.z,
        scale_x: currentPhysicsObject.scale.x,
        scale_y: currentPhysicsObject.scale.y,
        scale_z: currentPhysicsObject.scale.z,
        restitution: currentPhysicsObject.material_properties.restitution,
        friction: currentPhysicsObject.material_properties.friction,
        density: currentPhysicsObject.material_properties.density,
      });
    }
  }, [isEdit, currentPhysicsObject, form]);

  const handleSubmit = async (values) => {
    // Transform form values to API format
    const physicsObjectData = {
      name: values.name,
      mass: values.mass,
      is_static: values.is_static,
      is_trigger: values.is_trigger,
      collision_shape: values.collision_shape,
      position: {
        x: values.position_x,
        y: values.position_y,
        z: values.position_z,
      },
      velocity: {
        x: values.velocity_x,
        y: values.velocity_y,
        z: values.velocity_z,
      },
      rotation: {
        x: values.rotation_x,
        y: values.rotation_y,
        z: values.rotation_z,
      },
      scale: {
        x: values.scale_x,
        y: values.scale_y,
        z: values.scale_z,
      },
      material_properties: {
        restitution: values.restitution,
        friction: values.friction,
        density: values.density,
      },
    };

    if (isEdit) {
      // Update existing physics object
      const result = await dispatch(
        updatePhysicsObject({
          id: currentPhysicsObject.id,
          data: physicsObjectData,
        })
      );
      if (!result.error && onSuccess) {
        onSuccess();
      }
    } else {
      // Create new physics object
      const result = await dispatch(
        createPhysicsObject({
          ...physicsObjectData,
          scene_id: sceneId,
        })
      );
      if (!result.error && onSuccess) {
        onSuccess();
      }
    }
  };

  return (
    <Card
      title={
        <Title level={4}>
          {isEdit ? "Edit Physics Object" : "Create Physics Object"}
        </Title>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          name: "",
          mass: 1.0,
          is_static: false,
          is_trigger: false,
          collision_shape: "box",
          position_x: 0,
          position_y: 0,
          position_z: 0,
          velocity_x: 0,
          velocity_y: 0,
          velocity_z: 0,
          rotation_x: 0,
          rotation_y: 0,
          rotation_z: 0,
          scale_x: 1,
          scale_y: 1,
          scale_z: 1,
          restitution: 0.7,
          friction: 0.3,
          density: 1.0,
        }}
      >
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: "Please enter a name" }]}
        >
          <Input placeholder="Enter object name" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="mass" label="Mass">
              <InputNumber min={0} step={0.1} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="is_static" label="Static" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="is_trigger"
              label="Trigger"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="collision_shape" label="Collision Shape">
          <Select>
            <Option value="box">Box</Option>
            <Option value="sphere">Sphere</Option>
            <Option value="capsule">Capsule</Option>
            <Option value="cylinder">Cylinder</Option>
            <Option value="cone">Cone</Option>
            <Option value="plane">Plane</Option>
          </Select>
        </Form.Item>

        <Divider orientation="left">Position</Divider>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="position_x" label="X">
              <InputNumber step={0.1} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="position_y" label="Y">
              <InputNumber step={0.1} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="position_z" label="Z">
              <InputNumber step={0.1} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">Velocity</Divider>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="velocity_x" label="X">
              <InputNumber step={0.1} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="velocity_y" label="Y">
              <InputNumber step={0.1} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="velocity_z" label="Z">
              <InputNumber step={0.1} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">Rotation</Divider>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="rotation_x" label="X">
              <InputNumber step={0.1} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="rotation_y" label="Y">
              <InputNumber step={0.1} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="rotation_z" label="Z">
              <InputNumber step={0.1} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">Scale</Divider>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="scale_x" label="X">
              <InputNumber min={0.1} step={0.1} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="scale_y" label="Y">
              <InputNumber min={0.1} step={0.1} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="scale_z" label="Z">
              <InputNumber min={0.1} step={0.1} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">Material Properties</Divider>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="restitution" label="Restitution">
              <InputNumber
                min={0}
                max={1}
                step={0.1}
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="friction" label="Friction">
              <InputNumber
                min={0}
                max={1}
                step={0.1}
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="density" label="Density">
              <InputNumber min={0} step={0.1} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px",
            marginTop: "16px",
          }}
        >
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {isEdit ? "Update" : "Create"}
          </Button>
        </div>
      </Form>
    </Card>
  );
};

PhysicsObjectForm.propTypes = {
  sceneId: PropTypes.string.isRequired,
  onSuccess: PropTypes.func,
  onCancel: PropTypes.func,
  isEdit: PropTypes.bool
};

PhysicsObjectForm.defaultProps = {
  onSuccess: () => {},
  onCancel: () => {},
  isEdit: false
};

export default PhysicsObjectForm;
