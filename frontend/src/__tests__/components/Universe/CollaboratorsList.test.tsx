import { render, screen } from '@testing-library/react';
import React from 'react';
import { ThemeProvider } from 'styled-components';
import { CollaboratorsList } from '../../../components/Universe/CollaboratorsList';
import { theme } from '../../../theme';

const mockActiveUsers = [
  {
    id: 1,
    username: 'John Doe',
    currentView: '/universe/1',
    cursorPosition: { x: 100, y: 100 },
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 2,
    username: 'Jane Smith',
    currentView: '/universe/1/settings',
    cursorPosition: null,
    lastUpdated: new Date(Date.now() - 5 * 60000).toISOString(), // 5 minutes ago
  },
];

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('CollaboratorsList', () => {
  it('renders list of active collaborators', () => {
    renderWithTheme(<CollaboratorsList activeUsers={mockActiveUsers} />);

    expect(screen.getByText('Active Collaborators (2)')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('shows current view for each collaborator', () => {
    renderWithTheme(<CollaboratorsList activeUsers={mockActiveUsers} />);

    expect(screen.getByText('Viewing: /universe/1')).toBeInTheDocument();
    expect(
      screen.getByText('Viewing: /universe/1/settings')
    ).toBeInTheDocument();
  });

  it('shows appropriate time format for last active', () => {
    renderWithTheme(<CollaboratorsList activeUsers={mockActiveUsers} />);

    expect(screen.getByText('Last active: Just now')).toBeInTheDocument();
    expect(screen.getByText('Last active: 5m ago')).toBeInTheDocument();
  });

  it('shows message when no collaborators are active', () => {
    renderWithTheme(<CollaboratorsList activeUsers={[]} />);

    expect(screen.getByText('Active Collaborators (0)')).toBeInTheDocument();
    expect(screen.getByText('No active collaborators')).toBeInTheDocument();
  });

  it('renders user avatars with initials', () => {
    renderWithTheme(<CollaboratorsList activeUsers={mockActiveUsers} />);

    expect(screen.getByText('JD')).toBeInTheDocument();
    expect(screen.getByText('JS')).toBeInTheDocument();
  });

  it('handles users without current view', () => {
    const usersWithoutView = [
      {
        ...mockActiveUsers[0],
        currentView: '',
      },
    ];

    renderWithTheme(<CollaboratorsList activeUsers={usersWithoutView} />);

    expect(screen.getByText('Idle')).toBeInTheDocument();
  });

  it('handles old timestamps', () => {
    const usersWithOldTimestamp = [
      {
        ...mockActiveUsers[0],
        lastUpdated: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // 25 hours ago
      },
    ];

    renderWithTheme(<CollaboratorsList activeUsers={usersWithOldTimestamp} />);

    expect(screen.getByText('Last active: 1d ago')).toBeInTheDocument();
  });
});
