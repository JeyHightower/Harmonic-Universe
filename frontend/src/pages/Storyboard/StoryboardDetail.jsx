import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { IconButton } from '../../components/common/Button';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Loader } from '../../components/common/Loader';
import { StoryboardEditor } from '../../components/Storyboard/StoryboardEditor';
import { api } from '../../services/api';

const Container = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.primary};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
`;

export default function StoryboardDetail() {
  const { universeId, storyboardId } = useParams();
  const navigate = useNavigate();
  const [storyboard, setStoryboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStoryboard = async () => {
      try {
        const response = await api.get(`/storyboards/${storyboardId}`);
        setStoryboard(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchStoryboard();
  }, [storyboardId]);

  const handleEdit = () => {
    navigate(`/universes/${universeId}/storyboards/${storyboardId}/edit`);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this storyboard?')) {
      return;
    }

    try {
      await api.delete(`/storyboards/${storyboardId}`);
      navigate(`/universes/${universeId}/storyboards`);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <Loader />;
  if (error) return <ErrorMessage message={error} />;
  if (!storyboard) return <ErrorMessage message="Storyboard not found" />;

  return (
    <Container>
      <Header>
        <Title>{storyboard.title}</Title>
        <ButtonGroup>
          <IconButton icon="edit" onClick={handleEdit} title="Edit storyboard">
            Edit
          </IconButton>
          <IconButton
            icon="delete"
            onClick={handleDelete}
            title="Delete storyboard"
            variant="danger"
          >
            Delete
          </IconButton>
        </ButtonGroup>
      </Header>

      <StoryboardEditor
        universeId={parseInt(universeId)}
        storyboardId={parseInt(storyboardId)}
      />
    </Container>
  );
}
