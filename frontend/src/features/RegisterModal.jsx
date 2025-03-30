import PropTypes from "prop-types";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import "./Auth.css";
import { register } from "../store/slices/authSlice";

const RegisterModal = ({ onClose }) => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});

  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Register form submitted");

    if (!validateForm()) {
      console.log("Form validation failed");
      return;
    }

    // Remove confirmPassword from data sent to API
    const { confirmPassword, ...registerData } = formData;

    try {
      console.log("Dispatching register action with:", {
        email: registerData.email,
        username: registerData.username,
      });
      const resultAction = await dispatch(register(registerData));

      if (register.fulfilled.match(resultAction)) {
        console.log("Registration successful");
        onClose();
      } else {
        console.error("Registration failed:", resultAction.error);
      }
    } catch (err) {
      console.error("Error during registration:", err);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Sign Up</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Choose a username"
              className={errors.username ? "input-error" : ""}
            />
            {errors.username && (
              <div className="error-message">{errors.username}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className={errors.email ? "input-error" : ""}
            />
            {errors.email && (
              <div className="error-message">{errors.email}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              className={errors.password ? "input-error" : ""}
            />
            {errors.password && (
              <div className="error-message">{errors.password}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              className={errors.confirmPassword ? "input-error" : ""}
            />
            {errors.confirmPassword && (
              <div className="error-message">{errors.confirmPassword}</div>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? "Creating Account..." : "Sign Up"}
            </button>
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
                Log in
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

RegisterModal.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default RegisterModal;
