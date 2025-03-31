import PropTypes from "prop-types";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Form, Input, Button, message } from "antd";
import { signup } from "../../store/slices/authSlice";
import { log } from "../../utils/logger";
import "./Auth.css";

const SignupModal = ({ onClose }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const { error } = useSelector((state) => state.auth);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      log("auth", "Attempting signup", { email: values.email });

      const resultAction = await dispatch(signup(values));
      if (signup.fulfilled.match(resultAction)) {
        log("auth", "Signup successful", { email: values.email });
        message.success("Signup successful!");
        onClose();
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
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      className="signup-form"
    >
      <Form.Item
        name="username"
        label="Username"
        rules={[
          { required: true, message: "Please enter a username" },
          { min: 3, message: "Username must be at least 3 characters" },
          { max: 20, message: "Username must be less than 20 characters" },
        ]}
      >
        <Input placeholder="Choose a username" />
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
        rules={[
          { required: true, message: "Please enter a password" },
          { min: 6, message: "Password must be at least 6 characters" },
        ]}
      >
        <Input.Password placeholder="Choose a password" />
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

      {error && <div className="error-message">{error}</div>}

      <div className="form-actions">
        <Button onClick={onClose}>Cancel</Button>
        <Button type="primary" htmlType="submit" loading={loading}>
          Sign Up
        </Button>
      </div>

      <div className="form-footer">
        <p>
          Already have an account?{" "}
          <button
            type="button"
            className="text-button"
            onClick={() => {
              onClose();
              window.location.href = "/#/?modal=login";
            }}
          >
            Login
          </button>
        </p>
      </div>
    </Form>
  );
};

SignupModal.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default SignupModal;
