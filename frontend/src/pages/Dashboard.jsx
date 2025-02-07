import {
    createUniverse,
    deleteUniverse,
    fetchUniverses,
    updateUniverse,
} from '@/store/slices/universeSlice';
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
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector(state => state.auth);
    const { universes, loading, error } = useSelector(state => state.universe);

    const [openDialog, setOpenDialog] = useState(false);
    const [editingUniverse, setEditingUniverse] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        isPublic: false,
    });

    useEffect(() => {
        dispatch(fetchUniverses());
    }, [dispatch]);

    const handleOpenDialog = (universe) => {
        if (universe) {
            setEditingUniverse(universe);
            setFormData({
                name: universe.name,
                description: universe.description,
                isPublic: universe.isPublic,
            });
        } else {
            setEditingUniverse(null);
            setFormData({
                name: '',
                description: '',
                isPublic: false,
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingUniverse(null);
        setFormData({
            name: '',
            description: '',
            isPublic: false,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingUniverse) {
                await dispatch(
                    updateUniverse({
                        universeId: editingUniverse.id,
                        data: formData,
                    })
                ).unwrap();
            } else {
                await dispatch(createUniverse(formData)).unwrap();
            }
            handleCloseDialog();
        } catch (err) {
            console.error('Failed to save universe:', err);
        }
    };

    const handleDelete = async (universeId) => {
        if (window.confirm('Are you sure you want to delete this universe?')) {
            try {
                await dispatch(deleteUniverse(universeId)).unwrap();
            } catch (err) {
                console.error('Failed to delete universe:', err);
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
                        New Universe
                    </Button>
                </Box>

                <Grid container spacing={3}>
                    {universes.map((universe) => (
                        <Grid item xs={12} md={6} key={universe.id}>
                            <Paper
                                sx={{
                                    p: 3,
                                    cursor: 'pointer',
                                    '&:hover': { boxShadow: 6 },
                                    position: 'relative',
                                }}
                                onClick={() => navigate(`/universe/${universe.id}`)}
                            >
                                <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenDialog(universe);
                                        }}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(universe.id);
                                        }}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Box>
                                <Typography variant="h6" gutterBottom>
                                    {universe.name}
                                </Typography>
                                <Typography color="text.secondary" sx={{ mb: 2 }}>
                                    {universe.description}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Created: {new Date(universe.createdAt).toLocaleDateString()}
                                </Typography>
                            </Paper>
                        </Grid>
                    ))}
                    {universes.length === 0 && !loading && (
                        <Grid item xs={12}>
                            <Paper sx={{ p: 3, textAlign: 'center' }}>
                                <Typography color="text.secondary">
                                    No universes yet. Start by creating one!
                                </Typography>
                            </Paper>
                        </Grid>
                    )}
                </Grid>

                <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                    <DialogTitle>
                        {editingUniverse ? 'Edit Universe' : 'New Universe'}
                    </DialogTitle>
                    <DialogContent>
                        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                            <TextField
                                fullWidth
                                label="Name"
                                name="name"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, name: e.target.value }))
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
                            {editingUniverse ? 'Save' : 'Create'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Container>
    );
};

export default Dashboard;
