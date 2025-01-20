// Validation rules
const rules = {
  required: value => ({
    valid: value !== undefined && value !== null && value !== '',
    message: 'This field is required',
  }),
  email: value => ({
    valid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: 'Please enter a valid email address',
  }),
  minLength: min => value => ({
    valid: value.length >= min,
    message: `Must be at least ${min} characters`,
  }),
  maxLength: max => value => ({
    valid: value.length <= max,
    message: `Must be no more than ${max} characters`,
  }),
  numeric: value => ({
    valid: !isNaN(value) && isFinite(value),
    message: 'Must be a valid number',
  }),
  range: (min, max) => value => ({
    valid: value >= min && value <= max,
    message: `Must be between ${min} and ${max}`,
  }),
  match: (field, fieldName) => (value, formData) => ({
    valid: value === formData[field],
    message: `Must match ${fieldName}`,
  }),
  username: value => ({
    valid: /^[a-zA-Z0-9_]{3,20}$/.test(value),
    message:
      'Username must be 3-20 characters and contain only letters, numbers, and underscores',
  }),
  password: value => ({
    valid: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/.test(value),
    message:
      'Password must be at least 8 characters and contain at least one letter and one number',
  }),
};

// Validate a single field
export const validateField = (value, fieldRules) => {
  for (const rule of fieldRules) {
    const validationFn = typeof rule === 'function' ? rule : rules[rule];
    const result = validationFn(value);
    if (!result.valid) {
      return result.message;
    }
  }
  return '';
};

// Validate entire form
export const validateForm = (formData, validationSchema) => {
  const errors = {};
  let isValid = true;

  Object.keys(validationSchema).forEach(field => {
    const fieldRules = validationSchema[field];
    const error = validateField(formData[field], fieldRules);
    if (error) {
      errors[field] = error;
      isValid = false;
    }
  });

  return { isValid, errors };
};

// Example validation schemas
export const loginValidationSchema = {
  email: [rules.required, rules.email],
  password: [rules.required, rules.minLength(8)],
};

export const signupValidationSchema = {
  username: [rules.required, rules.username],
  email: [rules.required, rules.email],
  password: [rules.required, rules.password],
  confirmPassword: [rules.required, rules.match('password', 'password')],
};

export const universeValidationSchema = {
  name: [rules.required, rules.minLength(3), rules.maxLength(50)],
  description: [rules.maxLength(500)],
  'physics_parameters.gravity': [
    rules.required,
    rules.numeric,
    rules.range(-20, 20),
  ],
  'physics_parameters.friction': [
    rules.required,
    rules.numeric,
    rules.range(0, 1),
  ],
  'physics_parameters.elasticity': [
    rules.required,
    rules.numeric,
    rules.range(0, 1),
  ],
  'physics_parameters.airResistance': [
    rules.required,
    rules.numeric,
    rules.range(0, 1),
  ],
  'music_parameters.tempo': [
    rules.required,
    rules.numeric,
    rules.range(40, 240),
  ],
};

// Form validation utilities

/**
 * Validates an email address
 * @param {string} email - The email to validate
 * @returns {boolean} Whether the email is valid
 */
export const isValidEmail = email => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates a password
 * @param {string} password - The password to validate
 * @returns {Object} Validation result with isValid and errors
 */
export const validatePassword = password => {
  const errors = [];

  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validates registration form data
 * @param {Object} data - The form data to validate
 * @returns {Object} Validation result with isValid and errors
 */
export const validateRegistration = data => {
  const errors = {};

  if (!data.email) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!data.password) {
    errors.password = 'Password is required';
  } else {
    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.errors[0];
    }
  }

  if (!data.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validates login form data
 * @param {Object} data - The form data to validate
 * @returns {Object} Validation result with isValid and errors
 */
export const validateLogin = data => {
  const errors = {};

  if (!data.email) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!data.password) {
    errors.password = 'Password is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validates universe form data
 * @param {Object} data - The form data to validate
 * @returns {Object} Validation result with isValid and errors
 */
export const validateUniverse = data => {
  const errors = {};

  if (!data.title) {
    errors.title = 'Title is required';
  } else if (data.title.length < 3) {
    errors.title = 'Title must be at least 3 characters long';
  }

  if (!data.description) {
    errors.description = 'Description is required';
  } else if (data.description.length < 10) {
    errors.description = 'Description must be at least 10 characters long';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export default {
  validateField,
  validateForm,
  rules,
};
