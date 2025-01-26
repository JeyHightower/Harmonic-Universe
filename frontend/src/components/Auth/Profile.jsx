import { Edit as EditIcon, Save as SaveIcon } from '@mui/icons-material';
import {
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Container,
    Grid,
    IconButton,
    TextField,
    Typography,
    alpha,
    styled
} from '@mui/material';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile } from '../../store/slices/authSlice';
import { RootState } from '../../store/store';

const ProfileCard = styled(Card)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.background.paper, 0.6),
  backdropFilter: 'blur(8px)',
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  width: theme.spacing(12),
  height: theme.spacing(12),
  margin: '0 auto',
  border: `4px solid ${theme.palette.primary.main}`,
  boxShadow: theme.shadows[3],
}));

const StatCard = styled(Card)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.background.paper, 0.4),
  backdropFilter: 'blur(4px)',
  padding: theme.spacing(2),
  textAlign: 'center',
  height: '100%',
}));

interface ProfileFormData {
  username: string;
  email: string;
  bio: string;
}

const Profile: React.FC = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    username: user?.username || '',
    email: user?.email || '',
    bio: user?.bio || '',
  });
  const [errors, setErrors] = useState<Partial<ProfileFormData>>({});

  const validateForm = () => {
    const newErrors: Partial<ProfileFormData> = {};

    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters long';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = 'Bio must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        await dispatch(updateProfile(formData));
        setIsEditing(false);
      } catch (error) {
        setErrors({
          email: 'This email is already taken',
        });
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name as keyof ProfileFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 8 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Your Profile
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your account settings and view your universe statistics
        </Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <ProfileCard>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ mb: 4, position: 'relative', textAlign: 'center' }}>
                <StyledAvatar src={user?.avatar_url} alt={user?.username}>
                  {user?.username?.[0]?.toUpperCase()}
                </StyledAvatar>
                <Box sx={{ position: 'absolute', top: 0, right: 0 }}>
                  <IconButton
                    color="primary"
                    onClick={() => setIsEditing(!isEditing)}
                    sx={{ backgroundColor: 'background.paper' }}
                  >
                    {isEditing ? <SaveIcon /> : <EditIcon />}
                  </IconButton>
                </Box>
              </Box>

              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      error={!!errors.username}
                      helperText={errors.username}
                      disabled={!isEditing}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      error={!!errors.email}
                      helperText={errors.email}
                      disabled={!isEditing}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Bio"
                      name="bio"
                      multiline
                      rows={4}
                      value={formData.bio}
                      onChange={handleChange}
                      error={!!errors.bio}
                      helperText={errors.bio || 'Tell us about yourself'}
                      disabled={!isEditing}
                    />
                  </Grid>

                  {isEditing && (
                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        fullWidth
                      >
                        Save Changes
                      </Button>
                    </Grid>
                  )}
                </Grid>
              </form>
            </CardContent>
          </ProfileCard>
        </Grid>

        <Grid item xs={12} md={4}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <StatCard>
                <Typography variant="h6" gutterBottom>
                  Universes Created
                </Typography>
                <Typography variant="h3" color="primary">
                  {user?.universes_count || 0}
                </Typography>
              </StatCard>
            </Grid>

            <Grid item xs={12}>
              <StatCard>
                <Typography variant="h6" gutterBottom>
                  Active Simulations
                </Typography>
                <Typography variant="h3" color="primary">
                  {user?.active_simulations || 0}
                </Typography>
              </StatCard>
            </Grid>

            <Grid item xs={12}>
              <StatCard>
                <Typography variant="h6" gutterBottom>
                  Member Since
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {new Date(user?.created_at || '').toLocaleDateString()}
                </Typography>
              </StatCard>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Profile;
