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

const RegisterModal = ({ onClose }) => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

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

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched({
      ...touched,
      [name]: true,
    });
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate username
    const usernameError = validateUsername(formData.username);
    if (usernameError) newErrors.username = usernameError;

    // Validate email
    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    // Validate password
    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;

    // Validate password confirmation
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
        setErrors({
          ...errors,
          submit:
            resultAction.error.message ||
            "Registration failed. Please try again.",
        });
      }
    } catch (err) {
      console.error("Error during registration:", err);
      setErrors({
        ...errors,
        submit: "An unexpected error occurred. Please try again.",
      });
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Your Account</h2>
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
              onBlur={handleBlur}
              placeholder="Choose a username"
              className={`form-input ${
                errors.username && touched.username ? "input-error" : ""
              }`}
            />
            {errors.username && touched.username && (
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
              onBlur={handleBlur}
              placeholder="Enter your email"
              className={`form-input ${
                errors.email && touched.email ? "input-error" : ""
              }`}
            />
            {errors.email && touched.email && (
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
              onBlur={handleBlur}
              placeholder="Create a password"
              className={`form-input ${
                errors.password && touched.password ? "input-error" : ""
              }`}
            />
            {errors.password && touched.password && (
              <div className="error-message">{errors.password}</div>
            )}
            <div className="password-requirements">
              <p>Password must contain:</p>
              <ul>
                <li
                  className={
                    formData.password.length >= 8 ? "requirement-met" : ""
                  }
                >
                  At least 8 characters
                </li>
                <li
                  className={
                    /[A-Z]/.test(formData.password) ? "requirement-met" : ""
                  }
                >
                  One uppercase letter
                </li>
                <li
                  className={
                    /[a-z]/.test(formData.password) ? "requirement-met" : ""
                  }
                >
                  One lowercase letter
                </li>
                <li
                  className={
                    /[0-9]/.test(formData.password) ? "requirement-met" : ""
                  }
                >
                  One number
                </li>
                <li
                  className={
                    /[!@#$%^&*]/.test(formData.password)
                      ? "requirement-met"
                      : ""
                  }
                >
                  One special character (!@#$%^&*)
                </li>
              </ul>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Confirm your password"
              className={`form-input ${
                errors.confirmPassword && touched.confirmPassword
                  ? "input-error"
                  : ""
              }`}
            />
            {errors.confirmPassword && touched.confirmPassword && (
              <div className="error-message">{errors.confirmPassword}</div>
            )}
          </div>

          {errors.submit && (
            <div className="error-message submit-error">{errors.submit}</div>
          )}

          <div className="form-actions">
            <button
              type="submit"
              className="submit-button"
              disabled={loading || Object.keys(errors).length > 0}
            >
              {loading ? "Creating Account..." : "Create Account"}
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
