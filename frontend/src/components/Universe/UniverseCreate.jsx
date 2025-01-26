import {
    Box,
    Button,
    Card,
    CardContent,
    Container,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
    alpha,
    styled,
} from '@mui/material';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createUniverse } from '../../store/slices/universeSlice';

const CreateCard = styled(Card)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.background.paper, 0.6),
  backdropFilter: 'blur(8px)',
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

const FormContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
}));

interface UniverseFormData {
  name: string;
  description: string;
  template: string;
  isPrivate: boolean;
}

const TEMPLATES = [
  { value: 'empty', label: 'Empty Universe' },
  { value: 'solar-system', label: 'Solar System' },
  { value: 'galaxy', label: 'Galaxy' },
  { value: 'nebula', label: 'Nebula' },
];

const UniverseCreate: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<UniverseFormData>({
    name: '',
    description: '',
    template: 'empty',
    isPrivate: false,
  });
  const [errors, setErrors] = useState<Partial<UniverseFormData>>({});

  const validateForm = () => {
    const newErrors: Partial<UniverseFormData> = {};

    if (!formData.name) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Name must be at least 3 characters long';
    }

    if (!formData.description) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        const response = await dispatch(createUniverse(formData));
        navigate(`/universe/${response.id}`);
      } catch (error) {
        setErrors({
          name: 'Failed to create universe. Please try again.',
        });
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name as string]: value,
    }));
    if (errors[name as keyof UniverseFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name as string]: undefined,
      }));
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 8 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Create New Universe
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Design your own universe with custom parameters and settings
        </Typography>
      </Box>

      <CreateCard>
        <CardContent sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            <FormContainer>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Universe Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    error={!!errors.name}
                    helperText={errors.name}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    name="description"
                    multiline
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    error={!!errors.description}
                    helperText={errors.description || 'Describe your universe and its purpose'}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel id="template-select-label">Template</InputLabel>
                    <Select
                      labelId="template-select-label"
                      name="template"
                      value={formData.template}
                      label="Template"
                      onChange={handleChange}
                    >
                      {TEMPLATES.map((template) => (
                        <MenuItem key={template.value} value={template.value}>
                          {template.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel id="privacy-select-label">Privacy</InputLabel>
                    <Select
                      labelId="privacy-select-label"
                      name="isPrivate"
                      value={formData.isPrivate}
                      label="Privacy"
                      onChange={handleChange}
                    >
                      <MenuItem value={false}>Public</MenuItem>
                      <MenuItem value={true}>Private</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    sx={{ mt: 2 }}
                  >
                    Create Universe
                  </Button>
                </Grid>
              </Grid>
            </FormContainer>
          </form>
        </CardContent>
      </CreateCard>
    </Container>
  );
};

export default UniverseCreate;
