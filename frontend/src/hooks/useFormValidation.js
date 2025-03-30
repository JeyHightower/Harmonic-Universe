import { useState, useCallback } from "react";
import errorService from "../services/errorService";
import { APP_CONFIG } from "../utils/config";

/**
 * Custom hook for handling form validation errors consistently across the application
 */
export function useFormValidation({ rules, onError, context }) {
  const [errors, setErrors] = useState([]);
  const [isValid, setIsValid] = useState(true);

  const validateField = useCallback(
    (field, value) => {
      const fieldRules = rules[field];
      if (!fieldRules) return null;

      // Required field validation
      if (fieldRules.required && (!value || value.trim() === "")) {
        return {
          field,
          message: `${field} is required`,
          code: "REQUIRED",
        };
      }

      // Min length validation
      if (
        fieldRules.minLength &&
        value &&
        value.length < fieldRules.minLength
      ) {
        return {
          field,
          message: `${field} must be at least ${fieldRules.minLength} characters`,
          code: "MIN_LENGTH",
        };
      }

      // Max length validation
      if (
        fieldRules.maxLength &&
        value &&
        value.length > fieldRules.maxLength
      ) {
        return {
          field,
          message: `${field} must be at most ${fieldRules.maxLength} characters`,
          code: "MAX_LENGTH",
        };
      }

      // Pattern validation
      if (fieldRules.pattern && value && !fieldRules.pattern.test(value)) {
        return {
          field,
          message: `${field} has an invalid format`,
          code: "INVALID_FORMAT",
        };
      }

      // Custom validation
      if (fieldRules.custom) {
        const result = fieldRules.custom(value);
        if (typeof result === "string") {
          return {
            field,
            message: result,
            code: "CUSTOM",
          };
        }
        if (!result) {
          return {
            field,
            message: `${field} is invalid`,
            code: "CUSTOM",
          };
        }
      }

      return null;
    },
    [rules]
  );

  const validateForm = useCallback(
    (values) => {
      const newErrors = [];

      // Validate each field
      Object.keys(rules).forEach((field) => {
        const error = validateField(field, values[field]);
        if (error) {
          newErrors.push(error);
        }
      });

      // Update error state
      setErrors(newErrors);
      setIsValid(newErrors.length === 0);

      // Log validation errors if any
      if (newErrors.length > 0) {
        errorService.handleError(new Error("Form validation failed"), context, {
          errors: newErrors,
        });
      }

      // Call onError callback if provided
      if (onError) {
        onError(newErrors);
      }

      return newErrors.length === 0;
    },
    [context, onError, rules, validateField]
  );

  const clearErrors = useCallback(() => {
    setErrors([]);
    setIsValid(true);
  }, []);

  const getFieldError = useCallback(
    (field) => {
      return errors.find((error) => error.field === field);
    },
    [errors]
  );

  const hasFieldError = useCallback(
    (field) => {
      return errors.some((error) => error.field === field);
    },
    [errors]
  );

  return {
    errors,
    isValid,
    validateForm,
    clearErrors,
    getFieldError,
    hasFieldError,
  };
}
