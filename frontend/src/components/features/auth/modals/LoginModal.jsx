import PropTypes from "prop-types";
import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Form, Input, Button, message } from "antd";
import { login, demoLogin } from "../../../store/thunks/authThunks";
import { log, AUTH_CONFIG, MODAL_CONFIG } from "../../../utils";
import { ModalSystem } from "../../../components/modals";
import "../styles/Auth.css";

const LoginModal = ({ onClose }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const { error } = useSelector((state) => state.auth);

  // Force close function to ensure proper cleanup
  const forceClose = () => {
    // Reset modal state
    document.body.classList.remove("modal-open");
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.width = "";
    document.body.style.overflow = "";

    // Call the provided onClose
    onClose();
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      log("auth", "Attempting login", { email: values.email });

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(values.email)) {
        message.error("Please enter a valid email address");
        setLoading(false);
        return;
      }

      // Validate password
      if (!values.password || values.password.length < 6) {
        message.error("Password must be at least 6 characters long");
        setLoading(false);
        return;
      }

      // Convert email to lowercase
      const loginData = {
        ...values,
        email: values.email.toLowerCase(),
      };

      const resultAction = await dispatch(login(loginData));

      if (login.fulfilled.match(resultAction)) {
        log("auth", "Login successful", { email: values.email });
        message.success("Login successful!");

        // Clear any stale form data
        form.resetFields();

        // Use setTimeout to ensure the success message is shown before closing
        setTimeout(() => {
          forceClose();

          // Dispatch a simple storage event to encourage components to refresh
          window.dispatchEvent(new Event("storage"));
        }, 500);
      } else {
        const errorMessage =
          resultAction.error?.message || "Invalid email or password";
        log("auth", "Login failed", { error: errorMessage });

        // Handle specific error cases
        if (errorMessage.includes("Invalid email or password")) {
          message.error("Invalid email or password. Please try again.");
        } else if (errorMessage.includes("Email and password are required")) {
          message.error("Please enter both email and password.");
        } else if (errorMessage.includes("Invalid JSON format")) {
          message.error("An error occurred. Please try again.");
        } else {
          message.error(errorMessage);
        }

        form.setFieldValue("password", "");
      }
    } catch (error) {
      const errorMessage = error.message || "Login failed. Please try again.";
      log("auth", "Login failed", { error: errorMessage });
      message.error(errorMessage);
      form.setFieldValue("password", "");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    form.resetFields();
  }, [form]);

  // Add effect to handle cleanup when component unmounts
  useEffect(() => {
    return () => {
      // Ensure body scroll is restored on unmount
      document.body.classList.remove("modal-open");
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <ModalSystem
      isOpen={true}
      onClose={forceClose}
      title="Login"
      size={MODAL_CONFIG.SIZES.MEDIUM}
      type="form"
      showCloseButton={true}
      closeOnEscape={true}
      closeOnBackdrop={true}
      preventBodyScroll={true}
      animation={MODAL_CONFIG.ANIMATIONS.FADE}
    >
      <Form
        form={form}
        onFinish={handleSubmit}
        layout="vertical"
        className="auth-form"
      >
        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Please input your email!" },
            { type: "email", message: "Please enter a valid email!" },
          ]}
        >
          <Input
            id="email"
            placeholder="Enter your email"
            autoComplete="email"
            disabled={loading}
          />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[
            { required: true, message: "Please input your password!" },
            { min: 8, message: "Password must be at least 8 characters!" },
          ]}
        >
          <Input.Password
            id="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            disabled={loading}
          />
        </Form.Item>

        <div className="form-actions">
          <Button onClick={forceClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className="auth-button"
            disabled={loading}
          >
            Login
          </Button>
        </div>
      </Form>
    </ModalSystem>
  );
};

LoginModal.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default LoginModal;
