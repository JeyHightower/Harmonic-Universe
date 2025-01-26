import { configureStore } from "@reduxjs/toolkit";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { thunk } from "redux-thunk";
import { beforeEach, describe, expect, it, vi } from "vitest";
import authReducer, { login } from "../../store/slices/authSlice";
import Login from "./Login";

// Mock the login thunk
vi.mock("../../store/slices/authSlice", async () => {
  const actual = await vi.importActual("../../store/slices/authSlice");
  return {
    ...actual,
    __esModule: true,
    login: vi.fn(),
  };
});

describe("Login Component", () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authReducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(thunk),
    });
    vi.clearAllMocks();
  });

  const renderLogin = () => {
    return render(
      <Provider store={store}>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </Provider>,
    );
  };

  it("renders login form with all fields", () => {
    renderLogin();
    expect(screen.getByTestId("login-container")).toBeDefined();
    expect(screen.getByTestId("email-input")).toBeDefined();
    expect(screen.getByTestId("password-input")).toBeDefined();
    expect(screen.getByTestId("login-button")).toBeDefined();
  });

  it("validates required fields", async () => {
    renderLogin();
    const form = screen.getByTestId("login-container").querySelector("form");
    fireEvent.submit(form);

    await waitFor(() => {
      const emailError = screen.getByTestId("email-error");
      const passwordError = screen.getByTestId("password-error");
      expect(emailError).toBeDefined();
      expect(passwordError).toBeDefined();
      expect(emailError.textContent.trim()).toBe("Email is required");
      expect(passwordError.textContent.trim()).toBe("Password is required");
    });
  });

  it("validates email format", async () => {
    renderLogin();
    const emailInput = screen.getByTestId("email-input");
    const passwordInput = screen.getByTestId("password-input");
    const form = screen.getByTestId("login-container").querySelector("form");

    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.submit(form);

    await waitFor(() => {
      const emailError = screen.getByTestId("email-error");
      expect(emailError).toBeDefined();
      expect(emailError.textContent.trim()).toBe("Invalid email format");
    });
  });

  it("submits form with valid data", async () => {
    const mockLoginResponse = {
      user: { id: 1, email: "test@example.com" },
      token: "test-token",
    };
    login.mockResolvedValueOnce({
      type: "auth/login/fulfilled",
      payload: mockLoginResponse,
    });

    renderLogin();
    const emailInput = screen.getByTestId("email-input");
    const passwordInput = screen.getByTestId("password-input");
    const form = screen.getByTestId("login-container").querySelector("form");

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });
  });

  it("displays error message on login failure", async () => {
    const errorMessage = "Invalid credentials";
    login.mockImplementationOnce(() => {
      throw new Error(errorMessage);
    });

    renderLogin();
    const emailInput = screen.getByTestId("email-input");
    const passwordInput = screen.getByTestId("password-input");
    const form = screen.getByTestId("login-container").querySelector("form");

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.submit(form);

    await waitFor(() => {
      const errorElement = screen.getByTestId("submit-error");
      expect(errorElement).toBeDefined();
      expect(errorElement.textContent.trim()).toBe(errorMessage);
    });
  });
});
