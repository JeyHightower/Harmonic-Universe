import { AppDispatch, RootState } from '@/store';
import {
    createProject,
    deleteProject,
    fetchProjects,
    updateProject,
} from '@/store/slices/projectSlice';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import {
    Box,
    Button,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    Paper,
    TextField,
    Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.auth);
    const { projects, loading, error } = useSelector((state: RootState) => state.projects);

    const [openDialog, setOpenDialog] = useState(false);
    const [editingProject, setEditingProject] = useState<any>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        is_public: false,
    });

    useEffect(() => {
        dispatch(fetchProjects());
    }, [dispatch]);

    const handleOpenDialog = (project?: any) => {
        if (project) {
            setEditingProject(project);
            setFormData({
                title: project.title,
                description: project.description,
                is_public: project.is_public,
            });
        } else {
            setEditingProject(null);
            setFormData({
                title: '',
                description: '',
                is_public: false,
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingProject(null);
        setFormData({
            title: '',
            description: '',
            is_public: false,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingProject) {
                await dispatch(
                    updateProject({
                        projectId: editingProject.id,
                        data: formData,
                    })
                ).unwrap();
            } else {
                await dispatch(createProject(formData)).unwrap();
            }
            handleCloseDialog();
        } catch (err) {
            console.error('Failed to save project:', err);
        }
    };

    const handleDelete = async (projectId: number) => {
        if (window.confirm('Are you sure you want to delete this project?')) {
            try {
                await dispatch(deleteProject(projectId)).unwrap();
            } catch (err) {
                console.error('Failed to delete project:', err);
            }
        }
    };

    return (
        <Container>
            <Box sx={{ mt: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Typography variant="h4" gutterBottom>
                        Welcome back, {user?.username}!
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog()}
                    >
                        New Project
                    </Button>
                </Box>

                <Grid container spacing={3}>
                    {projects.map((project) => (
                        <Grid item xs={12} md={6} key={project.id}>
                            <Paper
                                sx={{
                                    p: 3,
                                    cursor: 'pointer',
                                    '&:hover': { boxShadow: 6 },
                                    position: 'relative',
                                }}
                                onClick={() => navigate(`/project/${project.id}`)}
                            >
                                <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenDialog(project);
                                        }}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(project.id);
                                        }}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Box>
                                <Typography variant="h6" gutterBottom>
                                    {project.title}
                                </Typography>
                                <Typography color="text.secondary" sx={{ mb: 2 }}>
                                    {project.description}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Created: {new Date(project.created_at).toLocaleDateString()}
                                </Typography>
                            </Paper>
                        </Grid>
                    ))}
                    {projects.length === 0 && !loading && (
                        <Grid item xs={12}>
                            <Paper sx={{ p: 3, textAlign: 'center' }}>
                                <Typography color="text.secondary">
                                    No projects yet. Start by creating one!
                                </Typography>
                            </Paper>
                        </Grid>
                    )}
                </Grid>

                <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                    <DialogTitle>{editingProject ? 'Edit Project' : 'New Project'}</DialogTitle>
                    <DialogContent>
                        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                            <TextField
                                fullWidth
                                label="Title"
                                name="title"
                                value={formData.title}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                                }
                                required
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                fullWidth
                                label="Description"
                                name="description"
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                                }
                                multiline
                                rows={4}
                                sx={{ mb: 2 }}
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button onClick={handleSubmit} variant="contained">
                            {editingProject ? 'Save' : 'Create'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Container>
    );
};

export default Dashboard;
