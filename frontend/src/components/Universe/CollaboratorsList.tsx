import React from 'react';
import styled from 'styled-components';
import { UniverseState } from '../../hooks/useUniverseSocket';

const Container = styled.div`
  padding: 1rem;
  background: ${({ theme }) => theme.colors.background.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const Title = styled.h3`
  margin: 0 0 1rem;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.fontSizes.lg};
`;

const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const ListItem = styled.li`
  display: flex;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.light};

  &:last-child {
    border-bottom: none;
  }
`;

const UserAvatar = styled.div<{ color: string }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: ${({ color }) => color};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  margin-right: 0.75rem;
`;

const UserInfo = styled.div`
  flex: 1;
`;

const Username = styled.div`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const CurrentView = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const LastActive = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.text.tertiary};
`;

interface CollaboratorsListProps {
  activeUsers: UniverseState['activeUsers'];
}

function getInitials(username: string): string {
  return username
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getRandomColor(username: string): string {
  const colors = [
    '#4299E1', // blue
    '#48BB78', // green
    '#ED8936', // orange
    '#9F7AEA', // purple
    '#F56565', // red
    '#38B2AC', // teal
  ];
  const index = username
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[index % colors.length];
}

function formatLastActive(lastUpdated: string): string {
  const date = new Date(lastUpdated);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) {
    // less than 1 minute
    return 'Just now';
  } else if (diff < 3600000) {
    // less than 1 hour
    const minutes = Math.floor(diff / 60000);
    return `${minutes}m ago`;
  } else if (diff < 86400000) {
    // less than 1 day
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diff / 86400000);
    return `${days}d ago`;
  }
}

export function CollaboratorsList({ activeUsers }: CollaboratorsListProps) {
  return (
    <Container>
      <Title>Active Collaborators ({activeUsers.length})</Title>
      <List>
        {activeUsers.map(user => (
          <ListItem key={user.id}>
            <UserAvatar color={getRandomColor(user.username)}>
              {getInitials(user.username)}
            </UserAvatar>
            <UserInfo>
              <Username>{user.username}</Username>
              <CurrentView>
                {user.currentView ? `Viewing: ${user.currentView}` : 'Idle'}
              </CurrentView>
              <LastActive>
                Last active: {formatLastActive(user.lastUpdated)}
              </LastActive>
            </UserInfo>
          </ListItem>
        ))}
        {activeUsers.length === 0 && (
          <ListItem>
            <CurrentView>No active collaborators</CurrentView>
          </ListItem>
        )}
      </List>
    </Container>
  );
}
