/* eslint-env browser, node */
/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import styles from '../Universe.module.css';
import UniverseOverview from '../UniverseOverview';

// Mock CSS modules
vi.mock('../Universe.module.css', () => ({
  default: {
    overview: 'overview',
    description: 'description',
    stats: 'stats',
    stat: 'stat',
  },
}));

describe('UniverseOverview Component', () => {
  const mockUniverse = {
    description: 'A test universe description',
    gravity_constant: 9.81,
    environment_harmony: 0.75,
    created_at: '2024-01-23T12:00:00Z',
    updated_at: '2024-01-24T14:30:00Z',
  };

  it('renders universe details correctly', () => {
    render(<UniverseOverview universe={mockUniverse} />);

    const description = screen.getByTestId('universe-description');
    expect(description).toBeInTheDocument();
    expect(description.textContent).toBe(mockUniverse.description);

    const gravityStat = screen.getByTestId('gravity-stat');
    expect(gravityStat).toBeInTheDocument();
    expect(gravityStat.textContent).toContain('9.81');

    const harmonyStat = screen.getByTestId('harmony-stat');
    expect(harmonyStat).toBeInTheDocument();
    expect(harmonyStat.textContent).toContain('0.75');
  });

  it('formats dates correctly', () => {
    render(<UniverseOverview universe={mockUniverse} />);

    const createdDate = new Date(mockUniverse.created_at).toLocaleDateString();
    const updatedDate = new Date(mockUniverse.updated_at).toLocaleDateString();

    const createdStat = screen.getByTestId('created-stat');
    const updatedStat = screen.getByTestId('updated-stat');

    expect(createdStat.textContent).toContain(createdDate);
    expect(updatedStat.textContent).toContain(updatedDate);
  });

  it('displays all stat labels', () => {
    render(<UniverseOverview universe={mockUniverse} />);

    const gravityStat = screen.getByTestId('gravity-stat');
    const harmonyStat = screen.getByTestId('harmony-stat');
    const createdStat = screen.getByTestId('created-stat');
    const updatedStat = screen.getByTestId('updated-stat');

    expect(gravityStat.textContent).toContain('Gravity Constant:');
    expect(harmonyStat.textContent).toContain('Environment Harmony:');
    expect(createdStat.textContent).toContain('Created:');
    expect(updatedStat.textContent).toContain('Last Updated:');
  });

  it('returns null when universe prop is null', () => {
    const { container } = render(<UniverseOverview universe={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when universe prop is undefined', () => {
    const { container } = render(<UniverseOverview />);
    expect(container.firstChild).toBeNull();
  });

  it('handles missing optional properties gracefully', () => {
    const partialUniverse = {
      description: 'A test universe description',
      created_at: '2024-01-23T12:00:00Z',
      updated_at: '2024-01-24T14:30:00Z',
    };

    render(<UniverseOverview universe={partialUniverse} />);

    const description = screen.getByTestId('universe-description');
    expect(description.textContent).toBe(partialUniverse.description);

    const gravityStat = screen.getByTestId('gravity-stat');
    const harmonyStat = screen.getByTestId('harmony-stat');

    expect(gravityStat.textContent).toContain('Gravity Constant:');
    expect(harmonyStat.textContent).toContain('Environment Harmony:');
  });

  it('applies correct CSS classes', () => {
    render(<UniverseOverview universe={mockUniverse} />);

    const overview = screen.getByTestId('universe-overview');
    const description = screen.getByTestId('universe-description');
    const stats = screen.getByTestId('universe-stats');
    const gravityStat = screen.getByTestId('gravity-stat');

    expect(overview).toHaveClass(styles.overview);
    expect(description).toHaveClass(styles.description);
    expect(stats).toHaveClass(styles.stats);
    expect(gravityStat).toHaveClass(styles.stat);
  });

  it('renders description in a paragraph element', () => {
    render(<UniverseOverview universe={mockUniverse} />);

    const description = screen.getByTestId('universe-description');
    expect(description.tagName).toBe('P');
    expect(description).toHaveClass(styles.description);
  });

  it('renders stats in a structured layout', () => {
    render(<UniverseOverview universe={mockUniverse} />);

    const stats = screen.getByTestId('universe-stats');
    expect(stats).toBeInTheDocument();
    expect(stats).toHaveClass(styles.stats);
    expect(stats.children.length).toBe(4); // 4 stat items
  });
});
