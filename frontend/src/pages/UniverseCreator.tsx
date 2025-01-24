import useAuth from '@/hooks/useAuth';
import useUniverse from '@/hooks/useUniverse';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  FormControlLabel,
  Paper,
  Step,
  StepLabel,
  Stepper,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useFormik } from 'formik';
import React, { useState } from 'react';
import * as yup from 'yup';

const validationSchema = yup.object({
  name: yup
    .string()
    .min(3, 'Name should be at least 3 characters')
    .max(50, 'Name should not exceed 50 characters')
    .required('Name is required'),
  description: yup
    .string()
    .min(10, 'Description should be at least 10 characters')
    .max(500, 'Description should not exceed 500 characters')
    .required('Description is required'),
  gravity: yup
    .number()
    .min(0, 'Gravity must be positive')
    .max(100, 'Gravity must not exceed 100')
    .required('Gravity is required'),
  speed_of_light: yup
    .number()
    .min(1, 'Speed of light must be greater than 0')
    .max(300000, 'Speed of light must not exceed 300,000 km/s')
    .required('Speed of light is required'),
  time_dilation: yup
    .number()
    .min(0.1, 'Time dilation must be greater than 0.1')
    .max(10, 'Time dilation must not exceed 10')
    .required('Time dilation is required'),
  is_public: yup.boolean(),
  allow_guests: yup.boolean(),
});

const steps = ['Basic Information', 'Physical Laws', 'Settings'];

const UniverseCreator: React.FC = () => {
  const { requireAuth } = useAuth();
  const { handleCreateUniverse, isLoading, error } = useUniverse();
  const [activeStep, setActiveStep] = useState(0);

  const formik = useFormik({
    initialValues: {
      name: '',
      description: '',
      gravity: 9.81,
      speed_of_light: 299792,
      time_dilation: 1,
      is_public: false,
      allow_guests: false,
    },
    validationSchema,
    onSubmit: values => {
      handleCreateUniverse(values);
    },
  });

  const handleNext = () => {
    const stepFields = {
      0: ['name', 'description'],
      1: ['gravity', 'speed_of_light', 'time_dilation'],
      2: ['is_public', 'allow_guests'],
    }[activeStep];

    const hasErrors = stepFields.some(
      field => formik.touched[field] && formik.errors[field]
    );

    if (!hasErrors) {
      setActiveStep(prevStep => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1);
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              fullWidth
              id="name"
              name="name"
              label="Universe Name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
            />
            <TextField
              fullWidth
              id="description"
              name="description"
              label="Description"
              multiline
              rows={4}
              value={formik.values.description}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.description && Boolean(formik.errors.description)
              }
              helperText={
                formik.touched.description && formik.errors.description
              }
            />
          </Box>
        );
      case 1:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              fullWidth
              id="gravity"
              name="gravity"
              label="Gravity (m/s²)"
              type="number"
              value={formik.values.gravity}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.gravity && Boolean(formik.errors.gravity)}
              helperText={formik.touched.gravity && formik.errors.gravity}
            />
            <TextField
              fullWidth
              id="speed_of_light"
              name="speed_of_light"
              label="Speed of Light (km/s)"
              type="number"
              value={formik.values.speed_of_light}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.speed_of_light &&
                Boolean(formik.errors.speed_of_light)
              }
              helperText={
                formik.touched.speed_of_light && formik.errors.speed_of_light
              }
            />
            <TextField
              fullWidth
              id="time_dilation"
              name="time_dilation"
              label="Time Dilation Factor"
              type="number"
              value={formik.values.time_dilation}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.time_dilation &&
                Boolean(formik.errors.time_dilation)
              }
              helperText={
                formik.touched.time_dilation && formik.errors.time_dilation
              }
            />
          </Box>
        );
      case 2:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formik.values.is_public}
                  onChange={formik.handleChange}
                  name="is_public"
                />
              }
              label="Make this universe public"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formik.values.allow_guests}
                  onChange={formik.handleChange}
                  name="allow_guests"
                />
              }
              label="Allow guests to interact"
            />
            <Typography variant="body2" color="text.secondary">
              Public universes can be discovered by other users. Guest
              interaction allows non-collaborators to leave comments and
              reactions.
            </Typography>
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  React.useEffect(() => {
    requireAuth();
  }, [requireAuth]);

  return (
    <Container maxWidth="md">
      <Paper
        elevation={0}
        sx={{
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <Typography variant="h4" gutterBottom>
          Create New Universe
        </Typography>

        {error && <Alert severity="error">{error}</Alert>}

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map(label => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <form onSubmit={formik.handleSubmit}>
          {getStepContent(activeStep)}

          <Box
            sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4, gap: 2 }}
          >
            {activeStep !== 0 && <Button onClick={handleBack}>Back</Button>}
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                type="submit"
                disabled={isLoading}
                startIcon={
                  isLoading && <CircularProgress size={20} color="inherit" />
                }
              >
                Create Universe
              </Button>
            ) : (
              <Button variant="contained" onClick={handleNext}>
                Next
              </Button>
            )}
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default UniverseCreator;
