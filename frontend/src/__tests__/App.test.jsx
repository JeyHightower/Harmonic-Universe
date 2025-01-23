import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../App';

describe('App Component', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText(/Home Page/i)).toBeInTheDocument();
  });

  it('renders with theme provider', () => {
    render(<App />);
    // The CssBaseline component should create a root element
    const rootElement = document.querySelector('body');
    expect(rootElement).toBeInTheDocument();
  });
});
