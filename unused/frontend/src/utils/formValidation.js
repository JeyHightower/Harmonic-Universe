export const validateField = (value, validations) => {
  const errors = [];

  if (validations.required && !value) {
    errors.push("This field is required");
  }

  if (validations.minLength && value.length < validations.minLength) {
    errors.push(`Must be at least ${validations.minLength} characters`);
  }

  if (validations.maxLength && value.length > validations.maxLength) {
    errors.push(`Must be less than ${validations.maxLength} characters`);
  }

  if (validations.pattern && !validations.pattern.test(value)) {
    errors.push(validations.patternError || "Invalid format");
  }

  if (validations.custom) {
    const customError = validations.custom(value);
    if (customError) errors.push(customError);
  }

  return errors;
};

export const validateForm = (values, validationSchema) => {
  const errors = {};
  Object.keys(validationSchema).forEach((field) => {
    const fieldErrors = validateField(values[field], validationSchema[field]);
    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors[0];
    }
  });
  return errors;
};
