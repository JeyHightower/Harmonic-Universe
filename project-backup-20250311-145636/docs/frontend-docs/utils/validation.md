# Validation Utilities

## Overview

This document describes the validation utilities available for form validation and data validation.

## Basic Usage

```javascript
import { createValidator, formRules } from '../utils/validation';

// Create a validator
const validateUser = createValidator({
  username: formRules.username,
  email: formRules.email,
  password: formRules.password,
});

// Use in form submission
const handleSubmit = async values => {
  const errors = validateUser(values);
  if (errors) {
    setFormErrors(errors);
    return;
  }
  // Proceed with form submission
};
```

## Form Rules

### Email Validation

```javascript
const emailRule = formRules.email;

// Usage in form
<input
  type="email"
  name="email"
  onChange={handleChange}
  onBlur={() => {
    const error = emailRule.validate(email);
    setFieldError('email', error);
  }}
/>;
```

### Password Validation

```javascript
const passwordRule = formRules.password;

// Usage in form
<input
  type="password"
  name="password"
  onChange={handleChange}
  onBlur={() => {
    const error = passwordRule.validate(password);
    setFieldError('password', error);
  }}
/>;
```

### Username Validation

```javascript
const usernameRule = formRules.username;

// Usage in form
<input
  type="text"
  name="username"
  onChange={handleChange}
  onBlur={() => {
    const error = usernameRule.validate(username);
    setFieldError('username', error);
  }}
/>;
```

### Required Fields

```javascript
const requiredRule = formRules.required('Field Name');

// Usage in form field
<Form.Item name="field" rules={[formRules.required('Field Name')]}>
  <Input />
</Form.Item>;
```

### Array Validation

```javascript
const arrayRule = formRules.array(formRules.string);

// Usage
const validateTags = tags => {
  const error = arrayRule.validate(tags);
  setFieldError('tags', error);
};
```

### Object Validation

```javascript
const addressRule = formRules.object({
  street: formRules.string,
  city: formRules.string,
  country: formRules.string,
});

// Usage
const validateAddress = address => {
  const error = addressRule.validate(address);
  setFieldError('address', error);
};
```

## Custom Validation

```javascript
// Custom phone number validation
const phoneRule = {
  validate: value => {
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    return phoneRegex.test(value) ? null : 'Invalid phone number';
  },
};

// Usage in validator
const validator = createValidator({
  phone: phoneRule,
});

// Usage in component
const validatePhone = async value => {
  try {
    const result = await validator.validateField('phone', value);
    if (result.error) {
      console.error(`${result.field}: ${result.error}`);
    }
  } catch (error) {
    console.error('Validation failed:', error);
  }
};
```

## Form Integration

```javascript
import React from 'react';
import { Form } from 'antd';
import PropTypes from 'prop-types';
import { formRules } from '../utils/validation';

function UserForm({ onSubmit }) {
  const [form] = Form.useForm();

  const handleSubmit = async values => {
    try {
      await form.validateFields();
      onSubmit(values);
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  return (
    <Form form={form} onFinish={handleSubmit}>
      <Form.Item name="username" rules={[formRules.required('Username')]}>
        <Input />
      </Form.Item>
      {/* Other form fields */}
    </Form>
  );
}

UserForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};

export default UserForm;
```

## Best Practices

1. Define validation rules in a central location
2. Use consistent error messages
3. Handle async validation properly
4. Validate on blur for better UX
5. Show validation errors clearly
6. Use appropriate validation timing

## Testing

See `validation.test.js` for examples of testing validators and form rules.
