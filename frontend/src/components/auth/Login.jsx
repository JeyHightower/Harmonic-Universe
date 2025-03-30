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

const Login = ({ onClose }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
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
      const response = await api.post("/api/auth/login", formData);

      if (response.access_token) {
        localStorage.setItem("accessToken", response.access_token);
      }
      if (response.refresh_token) {
        localStorage.setItem("refreshToken", response.refresh_token);
      }

      // Fetch user info after successful login
      try {
        const userResponse = await api.get(endpoints.auth.me);
        dispatch(loginSuccess(userResponse));
        onClose();
      } catch (error) {
        console.error("Failed to fetch user info:", error);
        throw error;
      }
    } catch (error) {
      console.error("Login error:", error);
      let errorMessage = "An error occurred during login. Please try again.";

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
      <h2>Welcome Back</h2>
      <p>Please sign in to your account</p>
      <form onSubmit={handleSubmit}>
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
            placeholder="Enter your password"
          />
          {errors.password && (
            <span className="error-message">{errors.password}</span>
          )}
        </div>
        {errors.submit && <div className="error-message">{errors.submit}</div>}
        <Button
          type="submit"
          variant="primary"
          disabled={isLoading}
          className={isLoading ? "button-loading" : ""}
        >
          {isLoading ? "Signing in..." : "Sign In"}
        </Button>
      </form>
      <div className="auth-footer">
        <p>
          Don't have an account?{" "}
          <button onClick={() => onClose("REGISTER")} className="link-button">
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
