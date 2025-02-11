import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { login } from "../authSlice";
import styles from "./Auth.module.css";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [formErrors, setFormErrors] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Invalid email format";
    }
    if (!formData.password) {
      errors.password = "Password is required";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        const result = await dispatch(login(formData)).unwrap();
        if (result.token) {
          navigate("/dashboard");
        }
      } catch (err) {
        setFormErrors((prev) => ({
          ...prev,
          submit: err.message || "Login failed",
        }));
      }
    }
  };

  return (
    <div className={styles.authContainer} data-testid="login-container">
      <form onSubmit={handleSubmit} className={styles.authForm}>
        <h2>Login</h2>
        <div className={styles.formGroup}>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            className={formErrors.email ? styles.error : ""}
            data-testid="email-input"
          />
          {formErrors.email && (
            <span className={styles.errorText} data-testid="email-error">
              {formErrors.email}
            </span>
          )}
        </div>
        <div className={styles.formGroup}>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password"
            className={formErrors.password ? styles.error : ""}
            data-testid="password-input"
          />
          {formErrors.password && (
            <span className={styles.errorText} data-testid="password-error">
              {formErrors.password}
            </span>
          )}
        </div>
        {(formErrors.submit || error) && (
          <div className={styles.errorText} data-testid="submit-error">
            {formErrors.submit || error}
          </div>
        )}
        <button
          type="submit"
          className={styles.authButton}
          data-testid="login-button"
        >
          Login
        </button>
        <div className={styles.authLinks}>
          <a href="/register">Don't have an account? Sign up</a>
          <a href="/reset-password">Forgot password?</a>
        </div>
      </form>
    </div>
  );
};

export default Login;
