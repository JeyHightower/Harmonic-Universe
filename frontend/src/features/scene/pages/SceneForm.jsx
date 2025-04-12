import React, { useEffect, useState, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Form,
  Input,
  Button,
  Space,
  Select,
  Spin,
  message,
  notification,
  Divider,
  Row,
  Col,
  Card,
  Typography,
  DatePicker,
  Radio,
  Alert,
  Slider,
  Tooltip,
  Switch,
} from "antd";
import {
  DeleteOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import moment from "moment";
import dayjs from "dayjs";
import apiClient from "../../../services/api";
import { CharacterSelector } from "../../character";

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

// Destructure window.setTimeout to fix linter error
const { setTimeout } = window;

// Improved styles for modals
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
  // Add higher z-index for modals to ensure they appear above other content
  modalOverride: {
    zIndex: 1100,
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
        summary: "",
        universe_id: universeId,
      });
    }
  }, [initialValues, form, isEditMode, sceneId, universeId]);

  // Improved handler for all popup containers - consistent implementation
  const getPopupContainer = useCallback(
    (triggerNode) => triggerNode.parentNode || document.body,
    []
  );

  // Handle form submission
  const onFinish = async (values) => {
    console.log("SceneForm - Form submitted with values:", values);

    try {
      // Validate required fields manually first
      if (!values.name || values.name.trim() === "") {
        console.error("SceneForm - Missing required name field in form values");
        message.error("Scene name is required");
        throw new Error("Scene name is required");
      }

      if (!values.summary || values.summary.trim() === "") {
        console.error(
          "SceneForm - Missing required summary field in form values"
        );
        message.error("Scene summary is required");
        throw new Error("Scene summary is required");
      }

      // DEBUGGING: Get the exact form values before any processing
      const rawFormValues = form.getFieldsValue(true);
      console.log("DEBUG - Raw form values from form instance:", rawFormValues);

      // Format the values for API submission
      const formattedValues = {
        ...values,
        universe_id: universeId,
        // If we have an existing ID, include it
        id: sceneId || undefined,
        // Ensure name is correctly set and preserved
        name: values.name?.trim(),
        // Convert camelCase to snake_case
        time_of_day: values.timeOfDay || values.time_of_day || null,
        // Fix date handling - ensure proper format
        date_of_scene: values.dateOfScene
          ? values.dateOfScene.toISOString
            ? values.dateOfScene.toISOString()
            : values.dateOfScene
          : values.date_of_scene
          ? values.date_of_scene
          : null,
        // Copy name to title for flexibility
        title: values.name?.trim(),
        description: values.description || null,
        // Ensure summary is always set to a non-null value
        summary: values.summary || values.description || "",
        content: values.content || null,
        notes: values.notes || null,
        location: values.location || null,
        scene_type: values.scene_type || "default",
        status: values.status || "draft",
        significance: values.significance || "minor",
        order: values.order || 0,
        is_public: values.is_public || false,
        is_deleted: false, // Explicitly set to false
      };

      // Debug log
      console.log("SceneForm - Form field values before processing:", {
        name: values.name,
        summary: values.summary,
        description: values.description,
        content: values.content,
      });

      // Debug validation step
      if (!formattedValues.name) {
        console.error("CRITICAL: Name field is missing after formatting");
      }

      // CRITICAL: Make sure required fields are explicitly set as non-empty strings
      if (!formattedValues.name || formattedValues.name.trim() === "") {
        formattedValues.name = rawFormValues.name?.trim() || "Untitled Scene";
        console.log("Applied name fallback to:", formattedValues.name);
      }

      if (!formattedValues.summary || formattedValues.summary.trim() === "") {
        formattedValues.summary =
          rawFormValues.summary?.trim() ||
          formattedValues.description ||
          "No summary provided";
        console.log("Applied summary fallback to:", formattedValues.summary);
      }

      console.log("SceneForm - FINAL Formatted values:", formattedValues);

      // Final validation check
      if (!formattedValues.name) {
        console.error("SceneForm - Name validation failed after processing");
        message.error("Scene name is required");
        throw new Error("Scene name is required");
      }

      // Additional validation for required fields
      if (!formattedValues.summary) {
        console.error("SceneForm - Summary validation failed after processing");
        message.error("Scene summary is required");
        throw new Error("Scene summary is required");
      }

      // Call the onSubmit callback with formatted values
      const action = isEditMode ? "update" : "create";
      const result = await onSubmit(action, formattedValues);
      console.log("SceneForm - Submit result:", result);

      // Show success message
      message.success(
        `Scene ${isEditMode ? "updated" : "created"} successfully!`
      );

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

  // Handle focus/blur for all selects to ensure proper cleanup
  const handleSelectBlur = () => {
    // Force blur on all open selects
    document
      .querySelectorAll(".ant-select-dropdown:not(.ant-select-dropdown-hidden)")
      .forEach((dropdown) => {
        const selectId = dropdown.getAttribute("id")?.replace("-popup", "");
        if (selectId) {
          const select = document.getElementById(selectId);
          if (select) select.blur();
        }
      });
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
                  name="description"
                  label={<span style={formStyles.inputLabel}>Description</span>}
                >
                  <Input
                    placeholder="Short description of the scene"
                    disabled={readOnly}
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
                    getPopupContainer={getPopupContainer}
                    onOpenChange={handleDatePickerOpenChange}
                    popupStyle={{ ...formStyles.modalOverride }}
                    autoComplete="off"
                  />
                </Form.Item>

                <Form.Item
                  name="timeOfDay"
                  label={<span style={formStyles.inputLabel}>Time of Day</span>}
                >
                  <Select
                    placeholder="Select time of day"
                    disabled={readOnly}
                    getPopupContainer={getPopupContainer}
                    dropdownStyle={{ ...formStyles.modalOverride }}
                    onBlur={handleSelectBlur}
                    autoComplete="off"
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
                    getPopupContainer={getPopupContainer}
                    onBlur={handleSelectBlur}
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
