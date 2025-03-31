import PropTypes from "prop-types";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Form, Input, Button, message } from "antd";
import { login } from "../../store/slices/authSlice";
import { log } from "../../utils/logger";
import "./Auth.css";

const LoginModal = ({ onClose }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const { error } = useSelector((state) => state.auth);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      log("auth", "Attempting login", { email: values.email });

      const resultAction = await dispatch(login(values));
      if (login.fulfilled.match(resultAction)) {
        log("auth", "Login successful", { email: values.email });
        message.success("Login successful!");
        onClose();
      } else {
        throw new Error(resultAction.error.message);
      }
    } catch (error) {
      log("auth", "Login failed", { error: error.message });
      message.error(error.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      className="login-form"
    >
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

      {error && <div className="error-message">{error}</div>}

      <div className="form-actions">
        <Button onClick={onClose}>Cancel</Button>
        <Button type="primary" htmlType="submit" loading={loading}>
          Login
        </Button>
      </div>

      <div className="form-footer">
        <p>
          Don't have an account?{" "}
          <button
            type="button"
            className="text-button"
            onClick={() => {
              onClose();
              window.location.href = "/#/?modal=signup";
            }}
          >
            Sign up
          </button>
        </p>
      </div>
    </Form>
  );
};

LoginModal.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default LoginModal;
