import { useUniverse } from '@/hooks/useUniverse';
import { Universe } from '@/store/slices/universeSlice';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import {
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    TextField,
    Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const UniverseList = () => {
    const navigate = useNavigate();
    const {
        universes,
        loading,
        fetchUniverses,
        createUniverse,
        updateUniverse,
        deleteUniverse,
    } = useUniverse();

    const [openDialog, setOpenDialog] = useState(false);
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const [selectedUniverse, setSelectedUniverse] = useState<Universe | null>(
        null
    );
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        isPublic: false,
    });

    useEffect(() => {
        fetchUniverses();
    }, [fetchUniverses]);

    const handleOpenDialog = (universe?: Universe) => {
        if (universe) {
            setSelectedUniverse(universe);
            setFormData({
                name: universe.name,
                description: universe.description,
                isPublic: universe.isPublic,
            });
        } else {
            setSelectedUniverse(null);
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
        setSelectedUniverse(null);
        setFormData({
            name: '',
            description: '',
            isPublic: false,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (selectedUniverse) {
                await updateUniverse(selectedUniverse.id, formData);
            } else {
                const universe = await createUniverse(formData);
                if (universe) {
                    navigate(`/universe/${universe.id}`);
                }
            }
            handleCloseDialog();
        } catch (err) {
            console.error('Failed to save universe:', err);
        }
    };

    const handleDelete = async (universeId: number) => {
        try {
            await deleteUniverse(universeId);
            setOpenConfirmDialog(false);
        } catch (err) {
            console.error('Failed to delete universe:', err);
        }
    };

    if (loading) {
        return Loading...</Typography>;
    }

    return (
        
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3,
                }}
            >
                <Typography variant="h4">My Universes</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                >
                    Create Universe
                </Button>
            </Box>

            <Grid container spacing={3}>
                {universes.map((universe) => (
                    <Grid item xs={12} sm={6} md={4} key={universe.id}>
                        
                            
                                <Typography variant="h6" gutterBottom>
                                    {universe.name}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mb: 2 }}
                                >
                                    {universe.description}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Created:{' '}
                                    {new Date(
                                        universe.createdAt
                                    ).toLocaleDateString()}
                                </Typography>
                            </CardContent>
                            
                                <IconButton
                                    size="small"
                                    onClick={() => handleOpenDialog(universe)}
                                >
                                    <EditIcon />
                                </IconButton>
                                <IconButton
                                    size="small"
                                    onClick={() => {
                                        setSelectedUniverse(universe);
                                        setOpenConfirmDialog(true);
                                    }}
                                >
                                    <DeleteIcon />
                                </IconButton>
                                <Button
                                    size="small"
                                    onClick={() =>
                                        navigate(`/universe/${universe.id}`)
                                    }
                                >
                                    Open
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                maxWidth="sm"
                fullWidth
            >
                
                    {selectedUniverse ? 'Edit Universe' : 'Create Universe'}
                </DialogTitle>
                
                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                        <TextField
                            fullWidth
                            label="Name"
                            name="name"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    name: e.target.value,
                                }))
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
                                setFormData((prev) => ({
                                    ...prev,
                                    description: e.target.value,
                                }))
                            }
                            multiline
                            rows={4}
                            sx={{ mb: 2 }}
                        />
                    </Box>
                </DialogContent>
                
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained">
                        {selectedUniverse ? 'Save' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            <ConfirmDialog
                open={openConfirmDialog}
                title="Delete Universe"
                message="Are you sure you want to delete this universe? This action cannot be undone."
                onConfirm={() =>
                    selectedUniverse && handleDelete(selectedUniverse.id)
                }
                onCancel={() => setOpenConfirmDialog(false)}
            />
        </Box>
    );
};
