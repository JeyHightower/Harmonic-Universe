import PropTypes from "prop-types";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Form, Input, Button, message } from "antd";
import { login } from "../../store/slices/authSlice";
import { log } from "../../utils/logger";
import { AUTH_CONFIG } from "../../utils/config";
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
        <Input id="email" placeholder="Enter your email" />
      </Form.Item>

      <Form.Item
        label="Password"
        name="password"
        rules={[{ required: true, message: "Please input your password!" }]}
      >
        <Input.Password id="password" placeholder="Enter your password" />
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          block
          className="auth-button"
        >
          Login
        </Button>
      </Form.Item>
    </Form>
  );
};

LoginModal.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default LoginModal;
