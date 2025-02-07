import { AudioWorkspace } from '@/components/audio/AudioWorkspace';
import { useAudio } from '@/hooks/useAudio';
import { useProject } from '@/hooks/useProject';
import { AudioFormData } from '@/types/audio';
import {
    Box,
    Button,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Paper,
    Tab,
    Tabs,
    TextField,
    Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`project-tabpanel-${index}`}
            aria-labelledby={`project-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

export const Project: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const [tabValue, setTabValue] = useState(0);
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
    const [uploadFormData, setUploadFormData] = useState<{ title: string; file: File | null }>({
        title: '',
        file: null,
    });

    const {
        project,
        loading: projectLoading,
        error: projectError,
        fetchProject,
    } = useProject();

    const {
        uploadAudio,
        loading: audioLoading,
        error: audioError,
    } = useAudio(Number(projectId));

    useEffect(() => {
        if (projectId) {
            fetchProject(Number(projectId));
        }
    }, [projectId, fetchProject]);

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handleUploadDialogOpen = () => {
        setIsUploadDialogOpen(true);
    };

    const handleUploadDialogClose = () => {
        setIsUploadDialogOpen(false);
        setUploadFormData({ title: '', file: null });
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setUploadFormData(prev => ({
                ...prev,
                file: event.target.files![0],
            }));
        }
    };

    const handleUpload = async () => {
        if (!uploadFormData.file || !uploadFormData.title) return;

        const formData: AudioFormData = {
            title: uploadFormData.title,
            file: uploadFormData.file,
        };

        try {
            await uploadAudio(formData);
            handleUploadDialogClose();
        } catch (error) {
            console.error('Error uploading audio:', error);
        }
    };

    if (projectLoading) {
        return <Typography>Loading project...</Typography>;
    }

    if (projectError) {
        return <Typography color="error">Error: {projectError}</Typography>;
    }

    if (!project) {
        return <Typography>Project not found</Typography>;
    }

    return (
        <Container maxWidth="xl">
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom>
                    {project.title}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    {project.description}
                </Typography>
            </Box>

            <Paper sx={{ width: '100%', mb: 4 }}>
                <Tabs value={tabValue} onChange={handleTabChange}>
                    <Tab label="Audio" />
                    <Tab label="Physics" />
                    <Tab label="Visualization" />
                </Tabs>
            </Paper>

            <TabPanel value={tabValue} index={0}>
                <Box sx={{ mb: 2 }}>
                    <Button variant="contained" onClick={handleUploadDialogOpen}>
                        Upload Audio
                    </Button>
                </Box>
                <AudioWorkspace projectId={Number(projectId)} />
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
                <Typography>Physics workspace coming soon...</Typography>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
                <Typography>Visualization workspace coming soon...</Typography>
            </TabPanel>

            <Dialog open={isUploadDialogOpen} onClose={handleUploadDialogClose}>
                <DialogTitle>Upload Audio</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <TextField
                            fullWidth
                            label="Title"
                            value={uploadFormData.title}
                            onChange={(e) => setUploadFormData(prev => ({ ...prev, title: e.target.value }))}
                            sx={{ mb: 2 }}
                        />
                        <input
                            accept="audio/*"
                            style={{ display: 'none' }}
                            id="audio-file-input"
                            type="file"
                            onChange={handleFileChange}
                        />
                        <label htmlFor="audio-file-input">
                            <Button variant="outlined" component="span">
                                Choose File
                            </Button>
                        </label>
                        {uploadFormData.file && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                Selected file: {uploadFormData.file.name}
                            </Typography>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleUploadDialogClose}>Cancel</Button>
                    <Button
                        onClick={handleUpload}
                        disabled={!uploadFormData.file || !uploadFormData.title || audioLoading}
                    >
                        Upload
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};
