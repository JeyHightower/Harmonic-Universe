import { RootState } from "@/store";
import { createUniverse } from "@/store/slices/universeSlice";
import {
  Alert,
  Box,
  Button,
  Container,
  FormControlLabel,
  Paper,
  Step,
  StepLabel,
  Stepper,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useFormik } from "formik";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import * as yup from "yup";

const steps = ["Basic Information", "Physics Parameters", "Settings"];

const validationSchema = yup.object({
  name: yup
    .string()
    .required("Name is required")
    .min(3, "Name should be at least 3 characters")
    .max(100, "Name should not exceed 100 characters"),
  description: yup
    .string()
    .required("Description is required")
    .max(500, "Description should not exceed 500 characters"),
  gravity: yup
    .number()
    .required("Gravity is required")
    .min(0, "Gravity must be positive")
    .max(100, "Gravity must not exceed 100"),
  speed_of_light: yup
    .number()
    .required("Speed of light is required")
    .min(0, "Speed of light must be positive"),
  time_dilation: yup
    .number()
    .required("Time dilation is required")
    .min(0, "Time dilation must be positive")
    .max(1, "Time dilation must not exceed 1"),
  is_public: yup.boolean(),
  allow_guests: yup.boolean(),
});

const UniverseCreator: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const { loading, error } = useSelector((state: RootState) => state.universe);

  const formik = useFormik({
    initialValues: {
      name: "",
      description: "",
      gravity: 9.81,
      speed_of_light: 299792458,
      time_dilation: 1,
      is_public: false,
      allow_guests: false,
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        const universe = await dispatch(createUniverse(values)).unwrap();
        navigate(`/universe/${universe.id}`);
      } catch (error) {
        console.error("Failed to create universe:", error);
      }
    },
  });

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
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
              margin="normal"
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
              margin="normal"
            />
          </Box>
        );
      case 1:
        return (
          <Box>
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
              margin="normal"
            />
            <TextField
              fullWidth
              id="speed_of_light"
              name="speed_of_light"
              label="Speed of Light (m/s)"
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
              margin="normal"
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
              margin="normal"
            />
          </Box>
        );
      case 2:
        return (
          <Box>
            <FormControlLabel
              control={
                <Switch
                  id="is_public"
                  name="is_public"
                  checked={formik.values.is_public}
                  onChange={formik.handleChange}
                />
              }
              label="Make Universe Public"
            />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 1, mb: 2 }}
            >
              Public universes can be viewed by anyone
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  id="allow_guests"
                  name="allow_guests"
                  checked={formik.values.allow_guests}
                  onChange={formik.handleChange}
                />
              }
              label="Allow Guest Access"
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Guests can interact with your universe without creating an account
            </Typography>
          </Box>
        );
      default:
        return "Unknown step";
    }
  };

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Create New Universe
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <form onSubmit={formik.handleSubmit}>
          {getStepContent(activeStep)}

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
            {activeStep !== 0 && (
              <Button onClick={handleBack} sx={{ mr: 1 }}>
                Back
              </Button>
            )}
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                type="submit"
                disabled={loading || !formik.isValid}
              >
                {loading ? "Creating..." : "Create Universe"}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={!formik.isValid}
              >
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
