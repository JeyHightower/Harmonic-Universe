import {
  Button,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  message,
  Row,
  Select,
  Slider,
} from "antd";
import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import "../../styles/HarmonyParametersModal.css";
import apiClient from "../../services/api";

const { Option } = Select;

const HarmonyParametersModal = ({
  universeId,
  sceneId,
  initialData = null,
  onClose,
  isGlobalModal = false,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [scales, setScales] = useState([
    "Major",
    "Minor",
    "Dorian",
    "Phrygian",
    "Lydian",
    "Mixolydian",
    "Locrian",
  ]);
  const [tempos, setTempos] = useState({
    min: 60,
    max: 200,
    value: initialData?.tempo || 120,
  });

  const dispatch = useDispatch();

  useEffect(() => {
    if (initialData) {
      form.setFieldsValue({
        name: initialData.name,
        description: initialData.description,
        scale: initialData.scale,
        key: initialData.key,
        tempo: initialData.tempo,
        mood: initialData.mood,
        complexity: initialData.complexity,
      });
    }
  }, [initialData, form]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      const endpoint = initialData
        ? `/api/scenes/${sceneId}/harmony_parameters/${initialData.id}`
        : `/api/scenes/${sceneId}/harmony_parameters`;

      const response = await apiClient.post(endpoint, values);

      message.success(
        initialData
          ? "Harmony parameters updated successfully!"
          : "Harmony parameters created successfully!"
      );

      if (onClose) {
        onClose(response);
      }
    } catch (error) {
      console.error("Error saving harmony parameters:", error);
      message.error("Failed to save harmony parameters. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="harmony-parameters-modal">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          name: "",
          description: "",
          scale: "Major",
          key: "C",
          tempo: 120,
          mood: "Neutral",
          complexity: 5,
        }}
      >
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="name"
              label="Name"
              rules={[{ required: true, message: "Please enter a name" }]}
            >
              <Input placeholder="Enter harmony parameter name" />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item name="description" label="Description">
              <Input.TextArea placeholder="Enter a description" rows={3} />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">Musical Properties</Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="key"
              label="Key"
              rules={[{ required: true, message: "Please select a key" }]}
            >
              <Select placeholder="Select a key">
                {[
                  "C",
                  "C#",
                  "D",
                  "D#",
                  "E",
                  "F",
                  "F#",
                  "G",
                  "G#",
                  "A",
                  "A#",
                  "B",
                ].map((key) => (
                  <Option key={key} value={key}>
                    {key}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="scale"
              label="Scale"
              rules={[{ required: true, message: "Please select a scale" }]}
            >
              <Select placeholder="Select a scale">
                {scales.map((scale) => (
                  <Option key={scale} value={scale}>
                    {scale}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item
              name="tempo"
              label="Tempo (BPM)"
              rules={[{ required: true, message: "Please set a tempo" }]}
            >
              <Row>
                <Col span={18}>
                  <Slider
                    min={tempos.min}
                    max={tempos.max}
                    onChange={(value) => form.setFieldsValue({ tempo: value })}
                  />
                </Col>
                <Col span={6}>
                  <InputNumber
                    min={tempos.min}
                    max={tempos.max}
                    style={{ marginLeft: 16 }}
                  />
                </Col>
              </Row>
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">Emotional Properties</Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="mood"
              label="Mood"
              rules={[{ required: true, message: "Please select a mood" }]}
            >
              <Select placeholder="Select a mood">
                {[
                  "Happy",
                  "Sad",
                  "Energetic",
                  "Calm",
                  "Tense",
                  "Relaxed",
                  "Neutral",
                ].map((mood) => (
                  <Option key={mood} value={mood}>
                    {mood}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="complexity"
              label="Complexity"
              rules={[{ required: true, message: "Please set complexity" }]}
            >
              <Row>
                <Col span={18}>
                  <Slider
                    min={1}
                    max={10}
                    onChange={(value) =>
                      form.setFieldsValue({ complexity: value })
                    }
                  />
                </Col>
                <Col span={6}>
                  <InputNumber min={1} max={10} style={{ marginLeft: 16 }} />
                </Col>
              </Row>
            </Form.Item>
          </Col>
        </Row>

        <div className="harmony-parameters-actions">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {initialData ? "Update" : "Create"}
          </Button>
        </div>
      </Form>
    </div>
  );
};

HarmonyParametersModal.propTypes = {
  universeId: PropTypes.string,
  sceneId: PropTypes.string,
  initialData: PropTypes.object,
  onClose: PropTypes.func,
  isGlobalModal: PropTypes.bool,
};

export default HarmonyParametersModal;
