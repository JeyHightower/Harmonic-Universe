# Button Component

## Basic Usage

```jsx
import { Button } from '@/components/common/ui/Button';

function Example() {
  return <Button>Click Me</Button>;
}
```

### Variants

```jsx
// Primary button
<Button variant="primary">Primary</Button>

// Secondary button
<Button variant="secondary">Secondary</Button>

// Tertiary button
<Button variant="tertiary">Tertiary</Button>

// Danger button
<Button variant="danger">Danger</Button>

// Accent button
<Button variant="accent">Accent</Button>

// Coral button
<Button variant="coral">Coral</Button>

// Mint button
<Button variant="mint">Mint</Button>

// Gold button
<Button variant="gold">Gold</Button>

// Icon button
<Button variant="icon"><Icon name="edit" /></Button>

// Icon danger button
<Button variant="icon-danger"><Icon name="trash" /></Button>
```

### Sizes

```jsx
<Button size="small">Small</Button>
<Button size="medium">Medium</Button>
<Button size="large">Large</Button>
```

### States

```jsx
<Button disabled>Disabled</Button>
<Button loading>Loading</Button>
```

### Full Width

```jsx
<Button fullWidth>Full Width Button</Button>
```

### Custom Styling

```jsx
<Button className="custom-button" style={{ backgroundColor: 'purple' }}>
  Custom Style
</Button>
```

### With Event Handlers

```jsx
function Example() {
  const handleClick = () => {
    console.log('Button clicked!');
  };

  return <Button onClick={handleClick}>Click Me</Button>;
}
```

### With Loading State

```jsx
function Example() {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await someAsyncOperation();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleClick} loading={loading} disabled={loading}>
      {loading ? 'Processing...' : 'Submit'}
    </Button>
  );
}
```

### As Link

```jsx
import { Link } from 'react-router-dom';

function Example() {
  return (
    <Button as={Link} to="/dashboard">
      Go to Dashboard
    </Button>
  );
}
```

## Props

The Button component accepts the following props:

- `variant`: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'icon' | 'icon-danger' | 'accent' | 'coral' | 'mint' | 'gold'
- `size`: 'small' | 'medium' | 'large'
- `disabled`: boolean
- `loading`: boolean
- `fullWidth`: boolean
- `as`: React.ElementType - Allows rendering as different element types (e.g., Link)
- `className`: string
- `onClick`: (event: React.MouseEvent) => void
- `children`: React.ReactNode
- ...other props are passed to the underlying element

## Best Practices

1. Use appropriate variants for different actions:

   - Primary for main actions
   - Secondary for alternative actions
   - Tertiary for less prominent actions
   - Danger for destructive actions
   - Accent, Coral, Mint, and Gold for specific UI themes or to highlight different action types

2. Maintain consistent sizing:

   - Use the same size for buttons in a group
   - Match size to the context (form, header, etc.)

3. Provide clear feedback:

   - Show loading states during async operations
   - Disable buttons when actions are unavailable

4. Accessibility:
   - Include descriptive text
   - Support keyboard navigation
   - Maintain sufficient contrast

## Examples

### Form Submit Button

```jsx
function SubmitButton({ onSubmit }) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="primary"
      onClick={handleSubmit}
      loading={loading}
      disabled={loading}
      fullWidth
    >
      {loading ? 'Submitting...' : 'Submit'}
    </Button>
  );
}

SubmitButton.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};
```

### Button Group

```jsx
function ButtonGroup() {
  return (
    <div className="button-group">
      <Button variant="tertiary">Cancel</Button>
      <Button variant="primary">Save</Button>
    </div>
  );
}
```

### Themed Action Buttons

```jsx
function ThemedActionButtons() {
  return (
    <div className="action-buttons">
      <Button variant="accent">Create Universe</Button>
      <Button variant="coral">Generate Music</Button>
      <Button variant="mint">Add Physics</Button>
      <Button variant="gold">Explore</Button>
    </div>
  );
}
```

## Features

- Consistent styling across variants
- Loading state management
- Responsive sizing
- Keyboard navigation
- ARIA attributes
- Custom styling support
- Event handling
- Component polymorphism (using the `as` prop)
