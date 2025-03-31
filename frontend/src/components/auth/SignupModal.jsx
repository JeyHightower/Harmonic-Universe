import PropTypes from "prop-types";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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
  const { error } = useSelector((state) => state.auth);

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

      // Convert email to lowercase
      const signupData = {
        ...values,
        email: values.email.toLowerCase(),
      };

      const resultAction = await dispatch(register(signupData));
      if (register.fulfilled.match(resultAction)) {
        log("auth", "Signup successful", { email: values.email });
        message.success("Signup successful! Please log in.");
        onClose();
        navigate("/login");
      } else {
        throw new Error(resultAction.error.message);
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
            { min: 6, message: "Password must be at least 6 characters!" },
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
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className="auth-button"
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
