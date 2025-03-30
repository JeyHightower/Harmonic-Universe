import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import useForm from "../../../hooks/useForm";
import { openModal } from "../../../store/slices/modalSlice";
import { registerUser } from "../../../store/thunks/authThunks";
import {
  validateEmail,
  validatePassword,
  validateUsername,
} from "../../../utils/validation";
import { Button } from "../components/common";
import Input from "../../common/Input";
import "./Auth.css";

function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

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

    if (!validateForm()) {
      dispatch(
        openModal({
          title: "Validation Error",
          content: "Please fix the errors in the form before submitting.",
          severity: "error",
        })
      );
      return;
    }

    try {
      const resultAction = await dispatch(registerUser(values));

      if (registerUser.fulfilled.match(resultAction)) {
        // Registration successful, navigate to dashboard
        navigate("/dashboard");
      } else {
        // Registration failed, show error in modal
        const errorMessage =
          resultAction.payload?.message ||
          "An error occurred during registration. Please try again.";

        dispatch(
          openModal({
            title: "Registration Error",
            content: errorMessage,
            severity: "error",
          })
        );
      }
    } catch (err) {
      console.error("Unexpected error during registration:", err);
      dispatch(
        openModal({
          title: "Registration Error",
          content: "An unexpected error occurred. Please try again.",
          severity: "error",
        })
      );
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h1>Register</h1>
        <p className="auth-description">
          Create your account to start building your universe.
        </p>
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
        <div className="password-requirements">
          <p>Password requirements:</p>
          <ul>
            <li
              className={values.password.length >= 8 ? "requirement-met" : ""}
            >
              At least 8 characters
            </li>
            <li
              className={/[A-Z]/.test(values.password) ? "requirement-met" : ""}
            >
              At least one uppercase letter
            </li>
            <li
              className={/[a-z]/.test(values.password) ? "requirement-met" : ""}
            >
              At least one lowercase letter
            </li>
            <li
              className={/[0-9]/.test(values.password) ? "requirement-met" : ""}
            >
              At least one number
            </li>
          </ul>
        </div>
        <Button type="submit" fullWidth disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </Button>
        <div className="auth-links">
          <p>
            Already have an account?{" "}
            <Link to="/login" className="auth-link">
              Login here
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}

export default Register;
