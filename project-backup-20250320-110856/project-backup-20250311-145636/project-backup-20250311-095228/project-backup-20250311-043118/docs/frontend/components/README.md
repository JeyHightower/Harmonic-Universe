# Components Documentation

## Core Components

### Auth Components

#### LoginForm
A form component for user authentication.

```jsx
import { LoginForm } from '../components/Auth/LoginForm';

<LoginForm onSuccess={() => {}} />
```

Props:
- `onSuccess`: Callback function called after successful login

State Management:
- Uses `useAuth` hook for authentication state
- Manages form validation state
- Handles loading and error states

#### RegisterForm
Registration form component for new users.

```jsx
import { RegisterForm } from '../components/Auth/RegisterForm';

<RegisterForm onSuccess={() => {}} />
```

Props:
- `onSuccess`: Callback function called after successful registration

State Management:
- Uses `useAuth` hook for registration
- Manages form validation state
- Handles loading and error states

### Universe Components

#### UniverseForm
Form component for creating and editing universes.

```jsx
import { UniverseForm } from '../components/Universe/UniverseForm';

// Create mode
<UniverseForm />

// Edit mode
<UniverseForm universe={existingUniverse} />
```

Props:
- `universe`: (Optional) Existing universe object for edit mode
- `onSuccess`: Callback function called after successful submission

State Management:
- Uses `useUniverse` hook for universe operations
- Manages form validation state
- Handles loading and error states

#### UniverseList
Component for displaying a list of universes.

```jsx
import { UniverseList } from '../components/Universe/UniverseList';

<UniverseList filter="my" /> // or "all"
```

Props:
- `filter`: String to filter universes ("my" or "all")

State Management:
- Uses `useUniverse` hook for fetching universes
- Handles loading and error states
- Manages pagination state

### Profile Components

#### ProfileForm
Form component for updating user profile.

```jsx
import { ProfileForm } from '../components/Profile/ProfileForm';

<ProfileForm profile={currentProfile} />
```

Props:
- `profile`: Current profile object
- `onSuccess`: Callback function called after successful update

State Management:
- Uses `useProfile` hook for profile operations
- Manages form validation state
- Handles loading and error states

### Layout Components

#### Navigation
Main navigation component.

```jsx
import { Navigation } from '../components/layout/Navigation';

<Navigation />
```

State Management:
- Uses `useAuth` hook for authentication state
- Manages active route state

#### ErrorBoundary
Error boundary component for handling component errors.

```jsx
import { ErrorBoundary } from '../components/layout/ErrorBoundary';

<ErrorBoundary fallback={<ErrorPage />}>
  {children}
</ErrorBoundary>
```

Props:
- `fallback`: Component to render when an error occurs
- `children`: Child components to wrap

## Common Components

### Form Components

#### Input
Reusable input component with validation.

```jsx
import { Input } from '../components/Common/Input';

<Input
  name="email"
  label="Email"
  type="email"
  error={errors.email}
  value={email}
  onChange={handleChange}
/>
```

Props:
- `name`: Input field name
- `label`: Input label
- `type`: Input type
- `error`: Error message
- `value`: Input value
- `onChange`: Change handler

#### Button
Reusable button component.

```jsx
import { Button } from '../components/Common/Button';

<Button
  variant="primary"
  loading={isLoading}
  disabled={isDisabled}
  onClick={handleClick}
>
  Submit
</Button>
```

Props:
- `variant`: Button style variant
- `loading`: Loading state
- `disabled`: Disabled state
- `onClick`: Click handler
- `children`: Button content

## Component Best Practices

1. Error Handling
- Use ErrorBoundary for component error catching
- Display user-friendly error messages
- Log errors appropriately

2. Loading States
- Show loading indicators during async operations
- Disable form submissions while loading
- Maintain UI responsiveness

3. Form Validation
- Implement client-side validation
- Show validation errors clearly
- Prevent submission of invalid data

4. State Management
- Use appropriate hooks for state management
- Keep component state minimal
- Lift state up when needed

5. Performance
- Implement proper memoization
- Avoid unnecessary re-renders
- Use lazy loading for large components

Last updated: Thu Jan 30 18:37:47 CST 2025
