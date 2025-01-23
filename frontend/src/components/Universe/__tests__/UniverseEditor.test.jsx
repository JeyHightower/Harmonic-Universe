/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import UniverseEditor from '../UniverseEditor';

// Mock child components
vi.mock('../../../components/MusicControls/MusicControlPanel', () => ({
  default: () => (
    <div data-testid="music-control-panel">Music Control Panel</div>
  ),
}));

vi.mock('../../../components/PhysicsControls/ForceFieldEditor', () => ({
  default: () => <div data-testid="force-field-editor">Force Field Editor</div>,
}));

vi.mock('../../../components/PhysicsControls/ParticleSystem', () => ({
  default: () => <div data-testid="particle-system">Particle System</div>,
}));

vi.mock('../../../components/PhysicsControls/PhysicsControlPanel', () => ({
  default: () => (
    <div data-testid="physics-control-panel">Physics Control Panel</div>
  ),
}));

// Mock CSS modules
vi.mock('../UniverseEditor.css', () => ({
  default: {
    'universe-editor': 'universe-editor',
    'editor-section': 'editor-section',
    'editor-content': 'editor-content',
    'visualization-panel': 'visualization-panel',
    'control-panels': 'control-panels',
  },
}));

describe('UniverseEditor Component', () => {
  const renderWithRouter = (universeId = '1') => {
    return render(
      <MemoryRouter initialEntries={[`/universe/${universeId}/edit`]}>
        <Routes>
          <Route
            path="/universe/:universeId/edit"
            element={<UniverseEditor />}
          />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders editor interface correctly', () => {
    renderWithRouter();

    expect(screen.getByText('Universe Editor')).toBeInTheDocument();
    expect(screen.getByTestId('music-control-panel')).toBeInTheDocument();
    expect(screen.getByTestId('force-field-editor')).toBeInTheDocument();
    expect(screen.getByTestId('particle-system')).toBeInTheDocument();
    expect(screen.getByTestId('physics-control-panel')).toBeInTheDocument();
  });

  it('passes universe ID to child components', () => {
    renderWithRouter('123');

    const particleSystem = screen.getByTestId('particle-system');
    const forceFieldEditor = screen.getByTestId('force-field-editor');
    const musicControlPanel = screen.getByTestId('music-control-panel');
    const physicsControlPanel = screen.getByTestId('physics-control-panel');

    expect(particleSystem).toHaveAttribute('universeId', '123');
    expect(forceFieldEditor).toHaveAttribute('universeId', '123');
    expect(musicControlPanel).toHaveAttribute('universeId', '123');
    expect(physicsControlPanel).toHaveAttribute('universeId', '123');
  });

  it('applies correct CSS classes', () => {
    renderWithRouter();

    expect(screen.getByTestId('universe-editor')).toHaveClass(
      'universe-editor'
    );
    expect(screen.getByTestId('editor-section')).toHaveClass('editor-section');
    expect(screen.getByTestId('editor-content')).toHaveClass('editor-content');
    expect(screen.getByTestId('visualization-panel')).toHaveClass(
      'visualization-panel'
    );
    expect(screen.getByTestId('control-panels')).toHaveClass('control-panels');
  });

  it('handles missing universe ID gracefully', () => {
    renderWithRouter('');

    expect(screen.getByText('Universe Editor')).toBeInTheDocument();
    expect(screen.getByTestId('particle-system')).toHaveAttribute(
      'universeId',
      ''
    );
  });

  it('maintains layout structure', () => {
    renderWithRouter();

    const editorContent = screen.getByTestId('editor-content');
    const visualizationPanel = screen.getByTestId('visualization-panel');
    const controlPanels = screen.getByTestId('control-panels');

    expect(editorContent).toContainElement(visualizationPanel);
    expect(editorContent).toContainElement(controlPanels);
    expect(visualizationPanel).toContainElement(
      screen.getByTestId('particle-system')
    );
    expect(visualizationPanel).toContainElement(
      screen.getByTestId('force-field-editor')
    );
    expect(controlPanels).toContainElement(
      screen.getByTestId('music-control-panel')
    );
    expect(controlPanels).toContainElement(
      screen.getByTestId('physics-control-panel')
    );
  });

  it('renders child components in correct order', () => {
    renderWithRouter();

    const editorContent = screen.getByTestId('editor-content');
    const childNodes = Array.from(editorContent.children);

    expect(childNodes[0]).toHaveClass('visualization-panel');
    expect(childNodes[1]).toHaveClass('control-panels');
  });
});
