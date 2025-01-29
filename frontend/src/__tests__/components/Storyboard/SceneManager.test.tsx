import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { ThemeProvider } from 'styled-components';
import { SceneManager } from '../../../components/Storyboard/SceneManager';
import { theme } from '../../../theme';

// Mock react-beautiful-dnd
jest.mock('react-beautiful-dnd', () => ({
  DragDropContext: ({ children }: { children: React.ReactNode }) => children,
  Droppable: ({ children }: { children: Function }) =>
    children({
      draggableProps: {
        style: {},
      },
      innerRef: jest.fn(),
    }),
  Draggable: ({ children }: { children: Function }) =>
    children(
      {
        draggableProps: {
          style: {},
        },
        innerRef: jest.fn(),
        dragHandleProps: {},
      },
      {
        isDragging: false,
      }
    ),
}));

const mockScenes = [
  {
    id: 1,
    title: 'Scene 1',
    sequence: 1,
    content: { duration: 60 },
  },
  {
    id: 2,
    title: 'Scene 2',
    sequence: 2,
    content: { duration: 120 },
  },
];

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('SceneManager', () => {
  const mockProps = {
    scenes: mockScenes,
    selectedSceneId: null,
    onSceneSelect: jest.fn(),
    onAddScene: jest.fn(),
    onUpdateScene: jest.fn(),
    onReorderScenes: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all scenes', () => {
    renderWithTheme(<SceneManager {...mockProps} />);

    expect(screen.getByText('Scene 1')).toBeInTheDocument();
    expect(screen.getByText('Scene 2')).toBeInTheDocument();
  });

  it('displays correct duration format', () => {
    renderWithTheme(<SceneManager {...mockProps} />);

    expect(screen.getByText('1:00')).toBeInTheDocument();
    expect(screen.getByText('2:00')).toBeInTheDocument();
  });

  it('handles scene selection', () => {
    renderWithTheme(<SceneManager {...mockProps} />);

    fireEvent.click(screen.getByText('Scene 1'));
    expect(mockProps.onSceneSelect).toHaveBeenCalledWith(1);
  });

  it('shows selected scene with different styling', () => {
    renderWithTheme(<SceneManager {...mockProps} selectedSceneId={1} />);

    const selectedScene = screen.getByText('Scene 1').closest('div');
    expect(selectedScene).toHaveStyle({
      background: theme.colors.primaryLight,
    });
  });

  it('handles add scene button click', () => {
    renderWithTheme(<SceneManager {...mockProps} />);

    fireEvent.click(screen.getByText('Add Scene'));
    expect(mockProps.onAddScene).toHaveBeenCalled();
  });

  it('shows edit and delete buttons for each scene', () => {
    renderWithTheme(<SceneManager {...mockProps} />);

    const editButtons = screen.getAllByTitle('Edit scene');
    const deleteButtons = screen.getAllByTitle('Delete scene');

    expect(editButtons).toHaveLength(2);
    expect(deleteButtons).toHaveLength(2);
  });

  // Note: Testing drag and drop functionality would require more complex setup
  // and is typically done with integration tests
});
