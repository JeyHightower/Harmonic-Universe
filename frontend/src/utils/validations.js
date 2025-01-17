export const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  export const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);

    const errors = [];

    if (password.length < minLength) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!hasUpperCase) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!hasLowerCase) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!hasNumbers) {
      errors.push('Password must contain at least one number');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  export const validateForm = (values, validations) => {
    const errors = {};

    Object.keys(validations).forEach(key => {
      const value = values[key];
      const validation = validations[key];

      if (validation.required && !value) {
        errors[key] = 'This field is required';
      } else if (validation.validate) {
        const result = validation.validate(value);
        if (!result.isValid) {
          errors[key] = result.errors[0];
        }
      }
    });

    return errors;
  };
