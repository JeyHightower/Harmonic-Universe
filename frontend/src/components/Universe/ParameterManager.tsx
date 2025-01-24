import { useAuth } from '@/hooks/useAuth';
import { useUI } from '@/hooks/useUI';
import { UniverseParameter } from '@/types/universe';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useFormik } from 'formik';
import React, { useEffect, useState } from 'react';
import * as yup from 'yup';

interface ParameterManagerProps {
  universeId: number;
}

interface ParameterFormValues {
  name: string;
  value: string;
  description: string;
}

const validationSchema = yup.object({
  name: yup
    .string()
    .required('Name is required')
    .min(2, 'Name should be at least 2 characters')
    .max(50, 'Name should not exceed 50 characters'),
  value: yup.string().required('Value is required'),
  description: yup
    .string()
    .required('Description is required')
    .max(200, 'Description should not exceed 200 characters'),
});

const ParameterManager: React.FC<ParameterManagerProps> = ({ universeId }) => {
  const { user } = useAuth();
  const { showAlert, showConfirmDialog } = useUI();
  const [parameters, setParameters] = useState<UniverseParameter[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingParameter, setEditingParameter] =
    useState<UniverseParameter | null>(null);

  const formik = useFormik<ParameterFormValues>({
    initialValues: {
      name: '',
      value: '',
      description: '',
    },
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        if (editingParameter) {
          // Update existing parameter
          const updatedParameter = {
            ...editingParameter,
            ...values,
          };
          // TODO: Implement updateParameter API call
          const index = parameters.findIndex(p => p.id === editingParameter.id);
          const newParameters = [...parameters];
          newParameters[index] = updatedParameter;
          setParameters(newParameters);
          showAlert({
            type: 'success',
            message: 'Parameter updated successfully',
          });
        } else {
          // Create new parameter
          const newParameter = {
            id: Date.now(), // Temporary ID until API integration
            universe_id: universeId,
            ...values,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          // TODO: Implement createParameter API call
          setParameters([...parameters, newParameter]);
          showAlert({
            type: 'success',
            message: 'Parameter created successfully',
          });
        }
        resetForm();
        setDialogOpen(false);
        setEditingParameter(null);
      } catch (error) {
        showAlert({
          type: 'error',
          message: 'Failed to save parameter',
        });
      }
    },
  });

  useEffect(() => {
    const fetchParameters = async () => {
      try {
        // TODO: Implement fetchParameters API call
        setLoading(false);
      } catch (error) {
        showAlert({
          type: 'error',
          message: 'Failed to fetch parameters',
        });
        setLoading(false);
      }
    };

    fetchParameters();
  }, [universeId]);

  const handleEditClick = (parameter: UniverseParameter) => {
    setEditingParameter(parameter);
    formik.setValues({
      name: parameter.name,
      value: parameter.value,
      description: parameter.description,
    });
    setDialogOpen(true);
  };

  const handleDeleteClick = (parameter: UniverseParameter) => {
    showConfirmDialog({
      title: 'Delete Parameter',
      message: `Are you sure you want to delete the parameter "${parameter.name}"?`,
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          // TODO: Implement deleteParameter API call
          setParameters(parameters.filter(p => p.id !== parameter.id));
          showAlert({
            type: 'success',
            message: 'Parameter deleted successfully',
          });
        } catch (error) {
          showAlert({
            type: 'error',
            message: 'Failed to delete parameter',
          });
        }
      },
    });
  };

  const handleAddClick = () => {
    setEditingParameter(null);
    formik.resetForm();
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h6">Universe Parameters</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddClick}
        >
          Add Parameter
        </Button>
      </Box>

      {parameters.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No parameters have been added yet.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Value</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {parameters.map(parameter => (
                <TableRow key={parameter.id}>
                  <TableCell>{parameter.name}</TableCell>
                  <TableCell>{parameter.value}</TableCell>
                  <TableCell>{parameter.description}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleEditClick(parameter)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(parameter)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={formik.handleSubmit}>
          <DialogTitle>
            {editingParameter ? 'Edit Parameter' : 'Add Parameter'}
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              id="name"
              name="name"
              label="Name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
              margin="normal"
            />
            <TextField
              fullWidth
              id="value"
              name="value"
              label="Value"
              value={formik.values.value}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.value && Boolean(formik.errors.value)}
              helperText={formik.touched.value && formik.errors.value}
              margin="normal"
            />
            <TextField
              fullWidth
              id="description"
              name="description"
              label="Description"
              multiline
              rows={3}
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
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={formik.isSubmitting}
            >
              {editingParameter ? 'Save Changes' : 'Add Parameter'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};

export default ParameterManager;
