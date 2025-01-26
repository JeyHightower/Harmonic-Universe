import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { resetPassword } from "../../store/slices/authSlice";
import styles from "./Auth.module.css";

const ResetPassword = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: "",
  });

  const [formErrors, setFormErrors] = useState({
    email: "",
  });

  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setFormErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Invalid email format";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        const result = await dispatch(resetPassword(formData)).unwrap();
        setSuccessMessage(result.message);
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } catch (err) {
        // Error handling is done in the slice
      }
    }
  };

  return (
    <div
      className={styles.authContainer}
      data-testid="reset-password-container"
    >
      <form className={styles.authForm} onSubmit={handleSubmit}>
        <h2>Reset Password</h2>
        <div className={styles.formGroup}>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            data-testid="email-input"
          />
          {formErrors.email && (
            <div className={styles.error} data-testid="email-error">
              {formErrors.email}
            </div>
          )}
        </div>
        {error && (
          <div className={styles.error} data-testid="submit-error">
            {error.message || error}
          </div>
        )}
        {successMessage && (
          <div className={styles.success} data-testid="submit-success">
            {successMessage}
          </div>
        )}
        <button
          type="submit"
          className={styles.authButton}
          data-testid="reset-button"
        >
          Reset Password
        </button>
        <div className={styles.authLinks}>
          <a href="/login">Back to Login</a>
        </div>
      </form>
    </div>
  );
};

export { ResetPassword };
