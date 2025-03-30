import React from "react";
import PropTypes from "prop-types";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import useForm from "../../hooks/useForm";
import {
  loginFailure,
  loginStart,
  loginSuccess,
} from "../../store/slices/authSlice";
import { openModal } from "../../store/slices/modalSlice";
import { api } from "../../services/api";
import { endpoints } from "../../services/endpoints";
import { validateEmail, validatePassword } from "../../utils/validation";
import { Button, Input } from "../common";
import "../../styles/Auth.css";

function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { values, errors, handleChange, handleBlur, validateForm } = useForm(
    {
      email: "",
      password: "",
    },
    {
      email: validateEmail,
      password: validatePassword,
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      dispatch(loginStart());
      const response = await api.post("/api/auth/login", values);
      console.debug("Login response:", response);

      if (response.access_token) {
        localStorage.setItem("accessToken", response.access_token);
      }
      if (response.refresh_token) {
        localStorage.setItem("refreshToken", response.refresh_token);
      }

      // Fetch user info after successful login
      try {
        const userResponse = await api.get(endpoints.auth.me);
        console.debug("User info response:", userResponse);
        dispatch(loginSuccess(userResponse));
        navigate("/dashboard");
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
      dispatch(
        openModal({
          title: "Login Error",
          content: errorMessage,
          severity: "error",
        })
      );
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h1>Login</h1>
        <Input
          type="email"
          label="Email"
          name="email"
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.email}
          required
        />
        <Input
          type="password"
          label="Password"
          name="password"
          value={values.password}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.password}
          required
        />
        <Button type="submit" fullWidth>
          Login
        </Button>
      </form>
    </div>
  );
}

export default Login;
