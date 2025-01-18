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

export default {
  validateField,
  validateForm,
  rules,
};
