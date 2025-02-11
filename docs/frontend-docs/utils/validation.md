# Validation System

A comprehensive validation system using Zod with built-in form integration.

## Installation

```tsx
import {
  commonSchemas,
  createValidator,
  formRules,
  createSchema,
} from '@/utils/validation';
```

## Usage

### Basic Schema Creation

```tsx
const userSchema = createSchema({
  username: commonSchemas.username,
  email: commonSchemas.email,
  password: commonSchemas.password,
});

const validateUser = createValidator(userSchema);

const result = validateUser({
  username: 'john_doe',
  email: 'john@example.com',
  password: 'Password123',
});

if (result.success) {
  // Data is valid
  console.log(result.data);
} else {
  // Handle validation errors
  console.error(result.errors);
}
```

### Form Integration

```tsx
function UserForm() {
  const [form] = Form.useForm();

  return (
    <Form form={form}>
      <Form.Item
        name="email"
        rules={[
          formRules.required('Email'),
          formRules.email,
        ]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[
          formRules.required('Password'),
          formRules.password,
        ]}
      >
        <Input.Password />
      </Form.Item>
    </Form>
  );
}
```

## Common Schemas

### Email

```tsx
const emailSchema = commonSchemas.email;
// Validates:
// - Must be a valid email format
// - Cannot be empty
```

### Password

```tsx
const passwordSchema = commonSchemas.password;
// Validates:
// - Minimum 8 characters
// - At least one uppercase letter
// - At least one lowercase letter
// - At least one number
```

### Username

```tsx
const usernameSchema = commonSchemas.username;
// Validates:
// - 3-20 characters
// - Only letters, numbers, underscores, and hyphens
```

### Required Fields

```tsx
const requiredSchema = commonSchemas.required(commonSchemas.string);
// Validates:
// - Value is not null
// - Value is not undefined
// - Value is not empty string
```

### Arrays

```tsx
const tagsSchema = commonSchemas.array(commonSchemas.string);
// Validates array of strings
```

### Objects

```tsx
const addressSchema = commonSchemas.object({
  street: commonSchemas.string,
  city: commonSchemas.string,
  country: commonSchemas.string,
});
```

## Form Rules

### Required Fields

```tsx
<Form.Item
  name="field"
  rules={[formRules.required('Field Name')]}
>
  <Input />
</Form.Item>
```

### Email Validation

```tsx
<Form.Item
  name="email"
  rules={[formRules.email]}
>
  <Input />
</Form.Item>
```

### Password Validation

```tsx
<Form.Item
  name="password"
  rules={[formRules.password]}
>
  <Input.Password />
</Form.Item>
```

### Combining Rules

```tsx
<Form.Item
  name="email"
  rules={combineRules(
    formRules.required('Email'),
    formRules.email
  )}
>
  <Input />
</Form.Item>
```

## Custom Validation

### Creating Custom Schemas

```tsx
const phoneSchema = z.string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
  .min(1, 'Phone number is required');

const schema = createSchema({
  phone: phoneSchema,
});
```

### Custom Form Rules

```tsx
const phoneRule = {
  validator: async (_: any, value: string) => {
    if (!value) return;
    const result = phoneSchema.safeParse(value);
    if (!result.success) {
      throw new Error(result.error.errors[0].message);
    }
  },
};
```

## Error Handling

### Validation Errors

```tsx
const result = validateUser(data);
if (!result.success) {
  Object.entries(result.errors).forEach(([field, errors]) => {
    console.error(`${field}: ${errors.join(', ')}`);
  });
}
```

### Form Errors

```tsx
<Form
  onFinish={async (values) => {
    const result = validateUser(values);
    if (!result.success) {
      form.setFields(
        Object.entries(result.errors).map(([name, errors]) => ({
          name,
          errors: errors.map(error => new Error(error)),
        }))
      );
      return;
    }
    // Process valid data
  }}
>
  {/* Form fields */}
</Form>
```

## Best Practices

1. Define schemas in a central location
2. Use type inference for better JavaScript support
3. Combine multiple rules when needed
4. Handle all validation errors appropriately
5. Use consistent error messages

## JavaScript

The validation system is fully typed:

```tsx
interface User {
  username: string;
  email: string;
  password: string;
}

const userSchema = createSchema<User>({
  username: commonSchemas.username,
  email: commonSchemas.email,
  password: commonSchemas.password,
});

// Type-safe validation
const validateUser = createValidator<User>(userSchema);
```

## Testing

See `validation.test.js` for examples of testing schemas, validators, and form rules.
