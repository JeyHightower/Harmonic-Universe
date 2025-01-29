import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { IconButton } from '../../components/common/Button';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Loader } from '../../components/common/Loader';
import { api } from '../../services/api';

const Container = styled.div`
  padding: 2rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.primary};
`;

const StoryboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const StoryboardCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  padding: 1.5rem;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
  }
`;

const CardTitle = styled.h3`
  margin: 0 0 0.5rem;
  color: ${({ theme }) => theme.colors.text};
`;

const CardDescription = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

export default function StoryboardList() {
  const { universeId } = useParams();
  const navigate = useNavigate();
  const [storyboards, setStoryboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStoryboards = async () => {
      try {
        const response = await api.get(`/universes/${universeId}/storyboards`);
        setStoryboards(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchStoryboards();
  }, [universeId]);

  const handleCreateStoryboard = async () => {
    try {
      const response = await api.post(`/universes/${universeId}/storyboards`, {
        title: 'New Storyboard',
        description: 'Add a description...',
      });
      navigate(`/universes/${universeId}/storyboards/${response.data.id}/edit`);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <Loader />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <Container>
      <Header>
        <Title>Storyboards</Title>
        <IconButton
          icon="plus"
          onClick={handleCreateStoryboard}
          title="Create new storyboard"
        >
          Create Storyboard
        </IconButton>
      </Header>

      <StoryboardGrid>
        {storyboards.map(storyboard => (
          <StoryboardCard
            key={storyboard.id}
            onClick={() =>
              navigate(`/universes/${universeId}/storyboards/${storyboard.id}`)
            }
          >
            <CardTitle>{storyboard.title}</CardTitle>
            <CardDescription>{storyboard.description}</CardDescription>
          </StoryboardCard>
        ))}
      </StoryboardGrid>
    </Container>
  );
}
