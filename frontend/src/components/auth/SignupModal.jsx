import PropTypes from "prop-types";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Form, Input, Button, message } from "antd";
import { register } from "../../store/thunks/authThunks";
import { log } from "../../utils/logger";
import {
  validateEmail,
  validatePassword,
  validateUsername,
} from "../../utils/validation";
import { useNavigate } from "react-router-dom";
import { ModalSystem } from "../modals";
import { MODAL_CONFIG } from "../../utils/config";
import "./Auth.css";

const SignupModal = ({ onClose }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      log("auth", "Attempting signup", { email: values.email });

      // Validate input
      const emailError = validateEmail(values.email);
      const passwordError = validatePassword(values.password);
      const usernameError = validateUsername(values.username);

      if (emailError || passwordError || usernameError) {
        throw new Error(emailError || passwordError || usernameError);
      }

      // Check if passwords match
      if (values.password !== values.confirmPassword) {
        throw new Error("Passwords do not match");
      }

      // Convert email to lowercase and prepare signup data
      const signupData = {
        username: values.username,
        email: values.email.toLowerCase(),
        password: values.password,
      };

      const resultAction = await dispatch(register(signupData));

      if (register.fulfilled.match(resultAction)) {
        log("auth", "Signup successful", { email: values.email });
        message.success("Signup successful!");
        onClose();

        // Navigate to dashboard instead of login page
        setTimeout(() => {
          navigate("/dashboard");
        }, 500);
      } else {
        throw new Error(
          resultAction.error.message || "Signup failed. Please try again."
        );
      }
    } catch (error) {
      log("auth", "Signup failed", { error: error.message });
      message.error(error.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalSystem
      isOpen={true}
      onClose={onClose}
      title="Sign Up"
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
          label="Username"
          name="username"
          rules={[
            { required: true, message: "Please input your username!" },
            { min: 3, message: "Username must be at least 3 characters!" },
          ]}
        >
          <Input placeholder="Choose a username" />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Please input your email!" },
            { type: "email", message: "Please enter a valid email!" },
          ]}
        >
          <Input placeholder="Enter your email" />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[
            { required: true, message: "Please input your password!" },
            { min: 8, message: "Password must be at least 8 characters!" },
            {
              pattern:
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
              message:
                "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)",
            },
          ]}
        >
          <Input.Password placeholder="Choose a password" />
        </Form.Item>

        <Form.Item
          label="Confirm Password"
          name="confirmPassword"
          dependencies={["password"]}
          rules={[
            { required: true, message: "Please confirm your password!" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("Passwords do not match!"));
              },
            }),
          ]}
        >
          <Input.Password placeholder="Confirm your password" />
        </Form.Item>

        <div className="form-actions">
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className="auth-button"
            disabled={loading}
          >
            Sign Up
          </Button>
        </div>
      </Form>
    </ModalSystem>
  );
};

SignupModal.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default SignupModal;
