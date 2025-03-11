# Custom Icons Implementation

This directory contains a custom implementation of icons for the application. It provides a consistent interface for using icons throughout the application and solves specific issues with the original Ant Design Icons library.

## Usage

### Basic Usage

```jsx
// Import specific icons
import { UserOutlined, SettingOutlined } from '../../components/common';

function MyComponent() {
  return (
    <div>
      <UserOutlined />
      <SettingOutlined style={{ color: 'blue' }} />
    </div>
  );
}
```

### Using the Index File

For convenience, you can import icons from the common index file:

```jsx
import { UserOutlined, SettingOutlined } from '../../components/common';
```

### Using with forwardRef

All icons support refs:

```jsx
import { UserOutlined } from '../../components/common';
import { useRef } from 'react';

function MyComponent() {
  const iconRef = useRef(null);

  return <UserOutlined ref={iconRef} />;
}
```

### Dynamic Icons

The implementation supports dynamically creating icons that aren't explicitly exported:

```jsx
import IconProvider from '../../components/common/Icons';

function MyComponent() {
  return (
    <div>
      {/* Works even if SomeSpecificOutlined isn't explicitly exported */}
      <IconProvider.SomeSpecificOutlined />
    </div>
  );
}
```

## Custom Icon Component

For custom SVG icons, use the basic Icon component:

```jsx
import { Icon } from '../../components/common';

function MyComponent() {
  return <Icon name="edit" size="large" />;
}
```

## Why We Created This

This custom implementation resolves several issues:

1. PropTypes warnings that occurred with the original Ant Design Icons
2. Issues with forwarding refs to icon components
3. Consistency in icon usage across the application
4. Better control over the available icons

## Maintenance

When upgrading Ant Design or adding new icons, follow these steps:

1. Check if the icon is already exported in `Icons.jsx`
2. If not, add it using the `createIconComponent` function
3. Test using the `IconTest` component

The implementation includes a proxy handler that will create icons on demand, so most icons should work without explicitly adding them.
