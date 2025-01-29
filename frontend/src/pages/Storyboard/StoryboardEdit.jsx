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

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
`;

const Form = styled.form`
  max-width: 800px;
  margin: 0 auto;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: ${({ theme }) => theme.colors.text};
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  font-size: 1rem;
  min-height: 150px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

export default function StoryboardEdit() {
  const { universeId, storyboardId } = useParams();
  const navigate = useNavigate();
  const [storyboard, setStoryboard] = useState({
    title: '',
    description: '',
    metadata: {},
  });
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

    if (storyboardId !== 'new') {
      fetchStoryboard();
    } else {
      setLoading(false);
    }
  }, [storyboardId]);

  const handleSubmit = async e => {
    e.preventDefault();

    try {
      if (storyboardId === 'new') {
        const response = await api.post(
          `/universes/${universeId}/storyboards`,
          storyboard
        );
        navigate(`/universes/${universeId}/storyboards/${response.data.id}`);
      } else {
        await api.put(`/storyboards/${storyboardId}`, storyboard);
        navigate(`/universes/${universeId}/storyboards/${storyboardId}`);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setStoryboard(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCancel = () => {
    navigate(
      storyboardId === 'new'
        ? `/universes/${universeId}/storyboards`
        : `/universes/${universeId}/storyboards/${storyboardId}`
    );
  };

  if (loading) return <Loader />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <Container>
      <Header>
        <Title>
          {storyboardId === 'new' ? 'Create Storyboard' : 'Edit Storyboard'}
        </Title>
        <ButtonGroup>
          <IconButton icon="save" onClick={handleSubmit} title="Save changes">
            Save
          </IconButton>
          <IconButton
            icon="cancel"
            onClick={handleCancel}
            title="Cancel changes"
            variant="secondary"
          >
            Cancel
          </IconButton>
        </ButtonGroup>
      </Header>

      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="title">Title</Label>
          <Input
            type="text"
            id="title"
            name="title"
            value={storyboard.title}
            onChange={handleChange}
            required
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="description">Description</Label>
          <TextArea
            id="description"
            name="description"
            value={storyboard.description}
            onChange={handleChange}
          />
        </FormGroup>
      </Form>
    </Container>
  );
}
