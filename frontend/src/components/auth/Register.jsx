import React, { useState } from "react";
import { useDispatch } from "react-redux";
import {
  loginStart,
  loginSuccess,
  loginFailure,
} from "../../store/slices/authSlice";
import { api, endpoints } from "../../utils/api";
import Button from "../../common/Button";
import "./Auth.css";

const Register = ({ onClose }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

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
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      dispatch(loginStart());
      const response = await api.post("/api/auth/register", {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      if (response.access_token) {
        localStorage.setItem("accessToken", response.access_token);
      }
      if (response.refresh_token) {
        localStorage.setItem("refreshToken", response.refresh_token);
      }

      // Fetch user info after successful registration
      try {
        const userResponse = await api.get(endpoints.auth.me);
        dispatch(loginSuccess(userResponse));
        onClose();
      } catch (error) {
        console.error("Failed to fetch user info:", error);
        throw error;
      }
    } catch (error) {
      console.error("Registration error:", error);
      let errorMessage =
        "An error occurred during registration. Please try again.";

      if (error.response) {
        const { data } = error.response;
        if (data.message) {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = data.error;
        }
      }

      dispatch(loginFailure(errorMessage));
      setErrors((prev) => ({
        ...prev,
        submit: errorMessage,
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <h2>Create Account</h2>
      <p>Join Harmonic Universe today</p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className={errors.username ? "error" : ""}
            placeholder="Choose a username"
          />
          {errors.username && (
            <span className="error-message">{errors.username}</span>
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
            className={errors.email ? "error" : ""}
            placeholder="Enter your email"
          />
          {errors.email && (
            <span className="error-message">{errors.email}</span>
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
            className={errors.password ? "error" : ""}
            placeholder="Create a password"
          />
          {errors.password && (
            <span className="error-message">{errors.password}</span>
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
            className={errors.confirmPassword ? "error" : ""}
            placeholder="Confirm your password"
          />
          {errors.confirmPassword && (
            <span className="error-message">{errors.confirmPassword}</span>
          )}
        </div>
        {errors.submit && <div className="error-message">{errors.submit}</div>}
        <Button
          type="submit"
          variant="primary"
          disabled={isLoading}
          className={isLoading ? "button-loading" : ""}
        >
          {isLoading ? "Creating account..." : "Create Account"}
        </Button>
      </form>
      <div className="auth-footer">
        <p>
          Already have an account?{" "}
          <button onClick={() => onClose("LOGIN")} className="link-button">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

export default Register;
