# Button Component

A flexible and customizable button component that extends Ant Design's Button with additional features.

## Installation

```tsx
import { Button } from '@/components/common/ui/Button';
```

## Usage

### Basic Usage

```tsx
<Button>Click me</Button>
```

### Variants

```tsx
<Button variant="primary">Primary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="dashed">Dashed</Button>
<Button variant="link">Link</Button>
<Button variant="text">Text</Button>
```

### Sizes

```tsx
<Button size="small">Small</Button>
<Button size="middle">Middle</Button>
<Button size="large">Large</Button>
```

### Full Width

```tsx
<Button fullWidth>Full Width Button</Button>
```

### With Icon

```tsx
import { SearchOutlined } from '@ant-design/icons';

<Button icon={<SearchOutlined />}>Search</Button>
```

### Button Group

```tsx
<Button.Group>
  <Button>Left</Button>
  <Button>Middle</Button>
  <Button>Right</Button>
</Button.Group>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | 'default' \| 'primary' \| 'ghost' \| 'dashed' \| 'link' \| 'text' | 'default' | The variant of the button |
| size | 'small' \| 'middle' \| 'large' | 'middle' | The size of the button |
| fullWidth | boolean | false | Whether the button should take up the full width |
| icon | ReactNode | - | Icon element to display |
| disabled | boolean | false | Whether the button is disabled |
| loading | boolean | false | Whether to show loading state |
| onClick | () => void | - | Click handler |
| className | string | - | Additional CSS class |

## Customization

The Button component uses the theme system for consistent styling. You can customize the appearance by modifying the theme:

```tsx
// styles/theme.ts
export const theme = {
  colors: {
    primary: {
      light: '#40a9ff',
      main: '#1890ff',
      dark: '#096dd9',
    },
    // ...
  },
  // ...
};
```

## Examples

### Loading State

```tsx
const [loading, setLoading] = useState(false);

<Button
  loading={loading}
  onClick={() => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  }}
>
  Click me
</Button>
```

### Disabled State

```tsx
<Button disabled>Disabled Button</Button>
```

### With Custom Styles

```tsx
<Button
  variant="primary"
  className={css`
    border-radius: 20px;
    text-transform: uppercase;
  `}
>
  Custom Styled Button
</Button>
```

## Best Practices

1. Use appropriate variants for different actions:
   - Primary for main actions
   - Ghost for secondary actions
   - Text for subtle actions

2. Maintain consistent sizing within the same view

3. Use meaningful labels that describe the action

4. Include loading states for async actions

5. Group related buttons using Button.Group

## Accessibility

The Button component follows WAI-ARIA guidelines:

- Uses native button element
- Supports keyboard navigation
- Includes proper ARIA attributes
- Maintains sufficient color contrast

## Testing

See `Button.test.tsx` for examples of testing different button states and interactions.
