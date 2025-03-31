import PropTypes from "prop-types";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import "./Auth.css";
import { register } from "../../store/slices/authSlice";
import {
  validateEmail,
  validatePassword,
  validateUsername,
} from "../../utils/validation";
import StableModalWrapper from "../modals/StableModalWrapper";
import { Form, Input, Button, message } from "antd";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../services/localApi";
import { log } from "../../utils/logger";

const RegisterModal = ({ onClose }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      log("auth", "Attempting registration", { email: values.email });

      // Validate input
      const emailError = validateEmail(values.email);
      const passwordError = validatePassword(values.password);
      const usernameError = validateUsername(values.username);

      if (emailError || passwordError || usernameError) {
        throw new Error(emailError || passwordError || usernameError);
      }

      // Register user
      const response = await apiClient.register({
        email: values.email,
        password: values.password,
        username: values.username,
      });

      log("auth", "Registration successful", { email: values.email });

      // Show success message
      message.success("Registration successful! Please log in.");

      // Close modal and redirect to login
      if (onClose) {
        onClose();
      }
      navigate("/login");
    } catch (error) {
      log("auth", "Registration failed", { error: error.message });
      message.error(error.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <StableModalWrapper title="Register" onClose={onClose}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="register-form"
      >
        <Form.Item
          name="username"
          label="Username"
          rules={[{ required: true, message: "Please enter your username" }]}
        >
          <Input placeholder="Enter your username" />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: "Please enter your email" },
            { type: "email", message: "Please enter a valid email" },
          ]}
        >
          <Input placeholder="Enter your email" />
        </Form.Item>

        <Form.Item
          name="password"
          label="Password"
          rules={[{ required: true, message: "Please enter your password" }]}
        >
          <Input.Password placeholder="Enter your password" />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="Confirm Password"
          dependencies={["password"]}
          rules={[
            { required: true, message: "Please confirm your password" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("Passwords do not match"));
              },
            }),
          ]}
        >
          <Input.Password placeholder="Confirm your password" />
        </Form.Item>

        <div className="form-actions">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            Register
          </Button>
        </div>
      </Form>
    </StableModalWrapper>
  );
};

RegisterModal.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default RegisterModal;
