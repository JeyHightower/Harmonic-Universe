import React from "react";
import PropTypes from "prop-types";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import useForm from "../../hooks/useForm";
import { loginSuccess } from "../../store/slices/authSlice";
import { openModal } from "../../store/slices/modalSlice";
import { api } from "../../services/api";
import { endpoints } from "../../services/endpoints";
import {
  validateEmail,
  validatePassword,
  validateUsername,
} from "../../utils/validation";
import { Button, Input } from "../common";
import "../../styles/Auth.css";

function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { values, errors, handleChange, handleBlur, validateForm } = useForm(
    {
      username: "",
      email: "",
      password: "",
    },
    {
      username: validateUsername,
      email: validateEmail,
      password: validatePassword,
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const response = await api.post("/api/auth/register", values);

      if (response.access_token) {
        localStorage.setItem("accessToken", response.access_token);
      }
      if (response.refresh_token) {
        localStorage.setItem("refreshToken", response.refresh_token);
      }

      dispatch(loginSuccess(response.user));
      navigate("/dashboard");
    } catch (error) {
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

      dispatch(
        openModal({
          title: "Registration Error",
          content: errorMessage,
          severity: "error",
        })
      );
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h1>Register</h1>
        <Input
          type="text"
          label="Username"
          name="username"
          value={values.username}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.username}
          required
        />
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
          Register
        </Button>
      </form>
    </div>
  );
}

export default Register;
