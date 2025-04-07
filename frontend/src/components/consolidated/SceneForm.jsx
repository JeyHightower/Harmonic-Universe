import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  Form,
  Input,
  Button,
  Space,
  Select,
  Spin,
  message,
  Divider,
  Row,
  Col,
  Card,
  Typography,
  DatePicker,
  Radio,
  Alert,
} from "antd";
import {
  DeleteOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import apiClient from "../../services/api";
import CharacterSelector from "../characters/CharacterSelector";
import moment from "moment";
import dayjs from "dayjs";

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

// Add custom styles to fix the dropdown and datepicker issues
const formStyles = {
  formCard: {
    boxShadow: "none",
    border: "1px solid #f0f0f0",
    borderRadius: "8px",
    marginBottom: "24px",
  },
  detailsCard: {
    marginBottom: "24px",
  },
  contentCard: {
    marginBottom: "24px",
  },
  formSection: {
    marginBottom: "24px",
  },
  formTitle: {
    fontSize: "18px",
    fontWeight: 600,
    marginBottom: "16px",
  },
  inputLabel: {
    fontWeight: 500,
  },
  contentTextarea: {
    minHeight: "200px",
    fontSize: "14px",
    lineHeight: 1.6,
  },
};

/**
 * SceneForm component for creating and editing scenes
 * Now used in both modal and page-based editing workflow
 */
const SceneForm = ({
  universeId,
  sceneId,
  initialData,
  onSubmit,
  onCancel,
  readOnly = false,
  registerSubmit,
  initialValues,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [characters, setCharacters] = useState([]);
  const [error, setError] = useState(null);

  const isEditMode = !!sceneId;

  // When component mounts, populate form with initial data if provided
  useEffect(() => {
    console.log("SceneForm - Component mounted with data:", {
      universeId,
      sceneId,
      hasInitialData: !!initialData,
    });

    if (initialData) {
      console.log(
        "SceneForm - Populating form with initial data for scene:",
        initialData.id
      );

      // Map API fields to form fields with appropriate transformations
      const formValues = {
        name: initialData.name || initialData.title,
        description: initialData.description,
        summary: initialData.summary,
        content: initialData.content,
        notes: initialData.notes,
        location: initialData.location,
        scene_type: initialData.scene_type || "default",
        timeOfDay: initialData.time_of_day || initialData.timeOfDay,
        status: initialData.status || "draft",
        significance: initialData.significance || "minor",
        characterIds:
          initialData.character_ids || initialData.characterIds || [],
        order: initialData.order || 0,
        dateOfScene:
          initialData.dateOfScene || initialData.date_of_scene
            ? moment(initialData.dateOfScene || initialData.date_of_scene)
            : null,
      };

      console.log("SceneForm - Transformed form values:", formValues);
      form.setFieldsValue(formValues);
    }
  }, [initialData, form]);

  // Load scene data if we have a sceneId but no initialData
  useEffect(() => {
    if (sceneId && !initialData) {
      const loadSceneData = async () => {
        try {
          console.log("SceneForm - Loading scene data for scene:", sceneId);
          setLoading(true);
          setError(null);

          const response = await apiClient.getScene(sceneId);
          const sceneData = response.data?.scene || response.data;

          console.log("SceneForm - Scene data loaded:", sceneData);

          if (sceneData) {
            // Map API fields to form fields with appropriate transformations
            const formValues = {
              name: sceneData.name || sceneData.title,
              description: sceneData.description,
              summary: sceneData.summary,
              content: sceneData.content,
              notes: sceneData.notes,
              location: sceneData.location,
              scene_type: sceneData.scene_type || "default",
              timeOfDay: sceneData.time_of_day || sceneData.timeOfDay,
              status: sceneData.status || "draft",
              significance: sceneData.significance || "minor",
              characterIds:
                sceneData.character_ids || sceneData.characterIds || [],
              order: sceneData.order || 0,
              dateOfScene:
                sceneData.dateOfScene || sceneData.date_of_scene
                  ? moment(sceneData.dateOfScene || sceneData.date_of_scene)
                  : null,
            };

            console.log("SceneForm - Transformed form values:", formValues);
            form.setFieldsValue(formValues);
          }
        } catch (error) {
          console.error("SceneForm - Error loading scene data:", error);
          setError(
            "Failed to load scene data. Please try refreshing the page."
          );
          message.error("Failed to load scene data");
        } finally {
          setLoading(false);
        }
      };

      loadSceneData();
    }
  }, [sceneId, initialData, form]);

  // Load characters for the universe
  useEffect(() => {
    const fetchCharacters = async () => {
      if (!universeId) return;

      try {
        console.log(
          `SceneForm - Fetching characters for universe ${universeId}`
        );
        // Make sure API is properly imported
        const response = await apiClient.getCharactersByUniverse(universeId);
        const charactersData = response.data?.characters || response.data || [];
        console.log("SceneForm - Characters fetched:", charactersData);
        setCharacters(charactersData);
      } catch (error) {
        console.error("SceneForm - Error fetching characters:", error);
        // Provide a fallback
        setCharacters([]);
        // Show user-friendly error notification
        notification.error({
          message: "Failed to load characters",
          description:
            "Please try again or contact support if the issue persists.",
        });
      }
    };

    fetchCharacters();
  }, [universeId]); // Ensure to include universeId in the dependency array

  // Register the submit function if the prop is provided
  useEffect(() => {
    if (registerSubmit && typeof registerSubmit === "function") {
      console.log(
        "SceneForm - Registering submit handler with parent component"
      );
      registerSubmit(() => {
        form.submit();
      });
    }
  }, [registerSubmit, form]);

  // Set up the form with initial values
  useEffect(() => {
    if (initialValues) {
      console.log(
        "SceneForm: Setting form values from initialValues:",
        initialValues
      );

      // Convert API snake_case to camelCase for the form fields
      const formattedValues = {
        ...initialValues,
        timeOfDay: initialValues.time_of_day || initialValues.timeOfDay,
        characterIds:
          initialValues.character_ids || initialValues.characterIds || [],
      };

      // Handle date formatting safely
      if (initialValues.date_of_scene) {
        try {
          const date = dayjs(initialValues.date_of_scene);
          if (date.isValid()) {
            formattedValues.dateOfScene = date;
          } else {
            console.warn(
              "SceneForm: Invalid date format for dateOfScene:",
              initialValues.date_of_scene
            );
            formattedValues.dateOfScene = null;
          }
        } catch (err) {
          console.error("SceneForm: Error parsing date:", err);
          formattedValues.dateOfScene = null;
        }
      } else {
        formattedValues.dateOfScene = null;
      }

      // Set form fields with the formatted values
      form.setFieldsValue(formattedValues);
      console.log("SceneForm: Form values set with:", formattedValues);
    } else if (isEditMode && sceneId) {
      // If we're in edit mode but don't have initial values, we might want to fetch them
      console.log(
        "SceneForm: Edit mode without initialValues, may need to fetch data"
      );
    } else {
      // For create mode, set some defaults if needed
      console.log("SceneForm: Create mode, using default values");
      form.setFieldsValue({
        title: "",
        description: "",
        universe_id: universeId,
      });
    }
  }, [initialValues, form, isEditMode, sceneId, universeId]);

  // Handle form submission
  const onFinish = async (values) => {
    console.log("SceneForm - Form submitted with values:", values);

    try {
      // Format the values for API submission
      const formattedValues = {
        ...values,
        universe_id: universeId,
        // Convert empty strings to null
        description: values.description || null,
        summary: values.summary || null,
        content: values.content || null,
        notes: values.notes || null,
        location: values.location || null,
        scene_type: values.scene_type || null,
        time_of_day: values.time_of_day || null,
        status: values.status || null,
        significance: values.significance || null,
        date_of_scene: values.date_of_scene
          ? values.date_of_scene.toISOString()
          : null,
        order: values.order || null,
        is_public: values.is_public || false,
      };

      console.log("SceneForm - Formatted values:", formattedValues);

      // Call the onSubmit callback with formatted values
      const result = await onSubmit(formattedValues);
      console.log("SceneForm - Submit result:", result);

      // Show success message
      message.success("Scene saved successfully!");

      // Call onCancel to close the form
      if (onCancel) {
        onCancel();
      }

      return result;
    } catch (error) {
      console.error("SceneForm - Error submitting form:", error);
      message.error(error.message || "Failed to save scene");
      throw error;
    }
  };

  const handleCancelClick = () => {
    console.log("SceneForm - Cancel button clicked");
    if (onCancel) {
      onCancel();
    }
  };

  // Handler to ensure DatePicker properly closes on selection
  const handleDatePickerOpenChange = (open) => {
    if (!open) {
      // Reset dropdown state or perform any cleanup when datepicker closes
      setTimeout(() => {
        form.validateFields(["dateOfScene"]);
      }, 100);
    }
  };

  if (loading) {
    return (
      <div
        className="form-loading-container"
        style={{ textAlign: "center", padding: "3rem" }}
      >
        <Spin size="large" />
        <p style={{ marginTop: "1rem", fontSize: "16px" }}>
          Loading scene data...
        </p>
      </div>
    );
  }

  return (
    <div className="scene-form-container">
      <Card
        bordered={false}
        className="scene-form-card main-form-card"
        style={formStyles.formCard}
      >
        <Title
          level={4}
          className="form-section-title"
          style={formStyles.formTitle}
        >
          {isEditMode ? "Edit Scene Details" : "Create New Scene"}
        </Title>
        <Text
          type="secondary"
          style={{ marginBottom: "24px", display: "block" }}
        >
          Fill in the information below to {isEditMode ? "update" : "create"}{" "}
          your scene
        </Text>

        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            icon={<WarningOutlined />}
            style={{ marginBottom: "24px" }}
            closable
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          disabled={readOnly}
          className="scene-form"
          style={{ marginTop: "24px" }}
          initialValues={{
            status: "draft",
            significance: "minor",
            scene_type: "default",
            order: 0,
          }}
        >
          <Row gutter={[24, 16]}>
            <Col xs={24} lg={16}>
              <Card
                className="scene-form-card content-card"
                title={<Title level={4}>Scene Details</Title>}
                style={formStyles.contentCard}
                bordered={true}
              >
                <Form.Item
                  name="name"
                  label={<span style={formStyles.inputLabel}>Scene Name</span>}
                  rules={[
                    { required: true, message: "Please enter a scene name" },
                  ]}
                >
                  <Input
                    placeholder="Enter scene name"
                    disabled={readOnly}
                    size="large"
                  />
                </Form.Item>

                <Form.Item
                  name="summary"
                  label={<span style={formStyles.inputLabel}>Summary</span>}
                  rules={[
                    { required: true, message: "Please enter a scene summary" },
                  ]}
                >
                  <TextArea
                    rows={3}
                    placeholder="Brief summary of the scene"
                    maxLength={200}
                    showCount
                    disabled={readOnly}
                  />
                </Form.Item>

                <Divider orientation="left">Scene Content</Divider>

                <Form.Item
                  name="content"
                  label={
                    <span style={formStyles.inputLabel}>Scene Content</span>
                  }
                  rules={[
                    { required: true, message: "Please enter scene content" },
                  ]}
                >
                  <TextArea
                    rows={6}
                    placeholder="Full content of the scene"
                    className="content-textarea"
                    disabled={readOnly}
                    style={formStyles.contentTextarea}
                  />
                </Form.Item>

                <Form.Item
                  name="notes"
                  label={
                    <span style={formStyles.inputLabel}>Writer's Notes</span>
                  }
                >
                  <TextArea
                    rows={3}
                    placeholder="Additional notes about the scene (for writer reference only)"
                    disabled={readOnly}
                  />
                </Form.Item>
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card
                className="properties-card"
                title={<Title level={4}>Properties</Title>}
                style={formStyles.detailsCard}
                bordered={true}
              >
                <Form.Item
                  name="location"
                  label={<span style={formStyles.inputLabel}>Location</span>}
                >
                  <Input
                    placeholder="Where the scene takes place"
                    disabled={readOnly}
                  />
                </Form.Item>

                <Form.Item
                  name="dateOfScene"
                  label={
                    <span style={formStyles.inputLabel}>Date of Scene</span>
                  }
                >
                  <DatePicker
                    format="YYYY-MM-DD"
                    style={{ width: "100%" }}
                    disabled={readOnly}
                    getPopupContainer={(trigger) => trigger.parentNode}
                    onOpenChange={handleDatePickerOpenChange}
                    popupStyle={{ zIndex: 1060 }}
                  />
                </Form.Item>

                <Form.Item
                  name="timeOfDay"
                  label={<span style={formStyles.inputLabel}>Time of Day</span>}
                >
                  <Select
                    placeholder="Select time of day"
                    disabled={readOnly}
                    getPopupContainer={(trigger) => trigger.parentNode}
                    dropdownStyle={{ zIndex: 1060 }}
                  >
                    <Option value="morning">Morning</Option>
                    <Option value="afternoon">Afternoon</Option>
                    <Option value="evening">Evening</Option>
                    <Option value="night">Night</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name="status"
                  label={<span style={formStyles.inputLabel}>Status</span>}
                >
                  <Radio.Group disabled={readOnly}>
                    <Radio value="draft">Draft</Radio>
                    <Radio value="review">Review</Radio>
                    <Radio value="complete">Complete</Radio>
                  </Radio.Group>
                </Form.Item>

                <Form.Item
                  name="significance"
                  label={
                    <span style={formStyles.inputLabel}>Significance</span>
                  }
                >
                  <Radio.Group disabled={readOnly}>
                    <Radio value="minor">Minor</Radio>
                    <Radio value="major">Major</Radio>
                    <Radio value="pivotal">Pivotal</Radio>
                  </Radio.Group>
                </Form.Item>

                <Divider orientation="left">Characters</Divider>

                <Form.Item
                  name="characterIds"
                  label={
                    <span style={formStyles.inputLabel}>
                      Characters in Scene
                    </span>
                  }
                >
                  <CharacterSelector
                    universeId={universeId}
                    characters={characters}
                    disabled={readOnly}
                    getPopupContainer={(trigger) => trigger.parentNode}
                  />
                </Form.Item>
              </Card>
            </Col>
          </Row>

          <Divider style={{ margin: "32px 0 24px" }} />

          {!readOnly && (
            <Form.Item
              className="form-actions"
              style={{ marginBottom: 0, textAlign: "right" }}
            >
              <Space size="middle">
                <Button
                  size="large"
                  onClick={handleCancelClick}
                  icon={<ArrowLeftOutlined />}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitting}
                  size="large"
                  icon={<SaveOutlined />}
                >
                  {isEditMode ? "Save" : "Create"} Scene
                </Button>
              </Space>
            </Form.Item>
          )}
        </Form>
      </Card>
    </div>
  );
};

SceneForm.propTypes = {
  universeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
  sceneId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  initialData: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  readOnly: PropTypes.bool,
  registerSubmit: PropTypes.func,
  initialValues: PropTypes.object,
};

export default SceneForm;
