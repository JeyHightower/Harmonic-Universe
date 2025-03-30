import { Form, Input, Select, Tabs } from "antd";
import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Button from "../components/Button";
import { updateUserProfile } from "../store/thunks/authThunks";

const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

/**
 * Modal for viewing and editing user profiles
 */
const UserProfileModal = ({ userId, onClose, isGlobalModal = false }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  // Get user data from Redux store
  const user = useSelector((state) => state.auth.user);
  const isCurrentUser = user && user.id === userId;

  // Set form values when user data changes
  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        username: user.username,
        email: user.email,
        bio: user.bio || "",
        theme_preference: user.theme_preference || "system",
        notification_preferences: user.notification_preferences || "all",
      });
    }
  }, [user, form]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      const profileData = {
        username: values.username,
        email: values.email,
        bio: values.bio,
        theme_preference: values.theme_preference,
        notification_preferences: values.notification_preferences,
      };

      await dispatch(updateUserProfile(profileData));
      onClose();
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-profile-modal">
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Profile" key="profile">
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              username: "",
              email: "",
              bio: "",
              theme_preference: "system",
              notification_preferences: "all",
            }}
          >
            <Form.Item
              name="username"
              label="Username"
              rules={[
                { required: true, message: "Please enter your username" },
              ]}
            >
              <Input placeholder="Enter username" disabled={!isCurrentUser} />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Please enter your email" },
                { type: "email", message: "Please enter a valid email" },
              ]}
            >
              <Input placeholder="Enter email" disabled={!isCurrentUser} />
            </Form.Item>

            <Form.Item name="bio" label="Bio">
              <TextArea
                placeholder="Tell us about yourself"
                autoSize={{ minRows: 3, maxRows: 6 }}
                disabled={!isCurrentUser}
              />
            </Form.Item>

            {isCurrentUser && (
              <>
                <Form.Item name="theme_preference" label="Theme Preference">
                  <Select>
                    <Option value="system">System Default</Option>
                    <Option value="light">Light</Option>
                    <Option value="dark">Dark</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name="notification_preferences"
                  label="Notification Preferences"
                >
                  <Select>
                    <Option value="all">All Notifications</Option>
                    <Option value="important">Important Only</Option>
                    <Option value="none">None</Option>
                  </Select>
                </Form.Item>
              </>
            )}

            {isCurrentUser && (
              <div className="form-actions">
                <Button type="secondary" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
                <Button type="primary" onClick={handleSubmit} loading={loading}>
                  Update Profile
                </Button>
              </div>
            )}
          </Form>
        </TabPane>

        <TabPane tab="Activity" key="activity">
          <div className="user-activity">
            <h3>Recent Activity</h3>
            <p>User activity will be displayed here.</p>
          </div>
        </TabPane>

        {isCurrentUser && (
          <TabPane tab="Settings" key="settings">
            <div className="user-settings">
              <h3>Account Settings</h3>
              <p>Additional account settings will be displayed here.</p>

              <div className="danger-zone">
                <h4>Danger Zone</h4>
                <Button type="danger">Delete Account</Button>
              </div>
            </div>
          </TabPane>
        )}
      </Tabs>
    </div>
  );
};

UserProfileModal.propTypes = {
  userId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  isGlobalModal: PropTypes.bool,
};

export default UserProfileModal;
