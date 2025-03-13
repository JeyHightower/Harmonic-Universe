# Button Group Component

Button groups allow you to organize related buttons together in a visually cohesive way. They can be used to create toolbars, pagination controls, or any other interface element that requires multiple related actions.

## Basic Usage

```jsx
import { Button } from '@/components/common/Button';

function Example() {
  return (
    <div className="button-group">
      <Button variant="tertiary">Cancel</Button>
      <Button variant="primary">Save</Button>
    </div>
  );
}
```

## Variants

### Default (Horizontal)

```jsx
<div className="button-group">
  <Button variant="secondary">Previous</Button>
  <Button variant="primary">Next</Button>
</div>
```

### Vertical

```jsx
<div className="button-group button-group--vertical">
  <Button variant="primary">Top</Button>
  <Button variant="secondary">Middle</Button>
  <Button variant="tertiary">Bottom</Button>
</div>
```

### Alignment

```jsx
// Right-aligned
<div className="button-group button-group--right">
  <Button variant="tertiary">Cancel</Button>
  <Button variant="primary">Save</Button>
</div>

// Center-aligned
<div className="button-group button-group--center">
  <Button variant="tertiary">Cancel</Button>
  <Button variant="primary">Save</Button>
</div>

// Space between
<div className="button-group button-group--space-between">
  <Button variant="tertiary">Back</Button>
  <Button variant="primary">Next</Button>
</div>
```

### Connected Buttons

```jsx
<div className="button-group button-group--connected">
  <Button variant="secondary">Left</Button>
  <Button variant="secondary">Middle</Button>
  <Button variant="secondary">Right</Button>
</div>
```

### Responsive

```jsx
<div className="button-group button-group--responsive">
  <Button variant="tertiary">Cancel</Button>
  <Button variant="secondary">Save Draft</Button>
  <Button variant="primary">Publish</Button>
</div>
```

## With Different Button Variants

```jsx
<div className="button-group">
  <Button variant="tertiary">Cancel</Button>
  <Button variant="secondary">Save Draft</Button>
  <Button variant="primary">Publish</Button>
</div>
```

```jsx
<div className="button-group">
  <Button variant="accent">Create Universe</Button>
  <Button variant="coral">Generate Music</Button>
  <Button variant="mint">Add Physics</Button>
  <Button variant="gold">Explore</Button>
</div>
```

## Best Practices

1. **Maintain visual hierarchy**:

   - Place the primary action on the right (for horizontal groups) or at the bottom (for vertical groups) in left-to-right languages
   - Use button variants to indicate importance (primary for main action, secondary for alternative actions, etc.)

2. **Keep it simple**:

   - Limit the number of buttons in a group to avoid overwhelming users
   - Group only related actions together

3. **Be consistent**:

   - Use the same button size within a group
   - Maintain consistent spacing between buttons

4. **Consider responsive behavior**:
   - Use the `button-group--responsive` class for mobile-friendly layouts
   - Test how button groups collapse on smaller screens

## CSS Classes

| Class                         | Description                                               |
| ----------------------------- | --------------------------------------------------------- |
| `button-group`                | Base class for all button groups                          |
| `button-group--vertical`      | Arranges buttons vertically                               |
| `button-group--right`         | Right-aligns the button group                             |
| `button-group--center`        | Center-aligns the button group                            |
| `button-group--space-between` | Distributes buttons with space between them               |
| `button-group--connected`     | Creates a connected button group with shared borders      |
| `button-group--responsive`    | Makes the button group stack vertically on mobile devices |

## Examples

### Form Actions

```jsx
function FormActions({ onCancel, onSave, onPublish, isSaving, isPublishing }) {
  return (
    <div className="button-group button-group--right">
      <Button variant="tertiary" onClick={onCancel}>
        Cancel
      </Button>
      <Button
        variant="secondary"
        onClick={onSave}
        loading={isSaving}
        disabled={isSaving || isPublishing}
      >
        Save Draft
      </Button>
      <Button
        variant="primary"
        onClick={onPublish}
        loading={isPublishing}
        disabled={isSaving || isPublishing}
      >
        Publish
      </Button>
    </div>
  );
}
```

### Pagination

```jsx
function Pagination({ currentPage, totalPages, onPageChange }) {
  return (
    <div className="button-group button-group--center">
      <Button
        variant="secondary"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </Button>
      <span className="pagination-info">
        Page {currentPage} of {totalPages}
      </span>
      <Button
        variant="secondary"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </Button>
    </div>
  );
}
```

### Toolbar

```jsx
function Toolbar({ onBold, onItalic, onUnderline, activeStyles }) {
  return (
    <div className="button-group button-group--connected">
      <Button
        variant={activeStyles.includes('bold') ? 'primary' : 'secondary'}
        onClick={onBold}
      >
        B
      </Button>
      <Button
        variant={activeStyles.includes('italic') ? 'primary' : 'secondary'}
        onClick={onItalic}
      >
        I
      </Button>
      <Button
        variant={activeStyles.includes('underline') ? 'primary' : 'secondary'}
        onClick={onUnderline}
      >
        U
      </Button>
    </div>
  );
}
```
