import { selectAudioFiles } from '@/store/slices/audioSlice';
import { selectProjects } from '@/store/slices/projectSlice';
import { selectCurrentVisualization } from '@/store/slices/visualizationSlice';
import { Box, FormControl, Grid, InputLabel, MenuItem, Paper, Select, Typography } from '@mui/material';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import DataMappingPanel from './DataMappingPanel';
import StreamConfigPanel from './StreamConfigPanel';
import VisualizationCanvas from './VisualizationCanvas';
import VisualizationList from './VisualizationList';
import VisualizationSettings from './VisualizationSettings';

const VisualizationWorkspace: React.FC = () => {
    const [selectedProjectId, setSelectedProjectId] = useState<number | ''>('');
    const [selectedAudioId, setSelectedAudioId] = useState<number | ''>('');
    const currentVisualization = useSelector(selectCurrentVisualization);
    const projects = useSelector(selectProjects);
    const audioFiles = useSelector(selectAudioFiles);

    const handleProjectChange = (event: React.ChangeEvent<{ value: unknown }>) => {
        setSelectedProjectId(event.target.value as number);
        setSelectedAudioId(''); // Reset audio selection when project changes
    };

    const handleAudioChange = (event: React.ChangeEvent<{ value: unknown }>) => {
        setSelectedAudioId(event.target.value as number);
    };

    const filteredAudioFiles = audioFiles.filter(
        audio => audio.projectId === selectedProjectId
    );

    return (
        <Box p={3}>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Project</InputLabel>
                                    <Select
                                        value={selectedProjectId}
                                        onChange={handleProjectChange}
                                        label="Project"
                                    >
                                        <MenuItem value="">
                                            <em>Select a project</em>
                                        </MenuItem>
                                        {projects.map(project => (
                                            <MenuItem key={project.id} value={project.id}>
                                                {project.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={6}>
                                <FormControl fullWidth disabled={!selectedProjectId}>
                                    <InputLabel>Audio File</InputLabel>
                                    <Select
                                        value={selectedAudioId}
                                        onChange={handleAudioChange}
                                        label="Audio File"
                                    >
                                        <MenuItem value="">
                                            <em>Select an audio file</em>
                                        </MenuItem>
                                        {filteredAudioFiles.map(audio => (
                                            <MenuItem key={audio.id} value={audio.id}>
                                                {audio.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                <Grid item xs={3}>
                    <Paper sx={{ p: 2, height: '80vh', overflow: 'auto' }}>
                        <VisualizationList
                            projectId={selectedProjectId as number}
                            audioId={selectedAudioId as number}
                        />
                    </Paper>
                </Grid>

                <Grid item xs={6}>
                    <Paper sx={{ p: 2, height: '80vh', overflow: 'hidden' }}>
                        {currentVisualization ? (
                            <VisualizationCanvas visualization={currentVisualization} />
                        ) : (
                            <Box
                                display="flex"
                                justifyContent="center"
                                alignItems="center"
                                height="100%"
                            >
                                <Typography variant="subtitle1" color="text.secondary">
                                    Select a visualization to view
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>

                <Grid item xs={3}>
                    <Box sx={{ height: '80vh', overflow: 'auto' }}>
                        <Grid container spacing={2}>
                            {currentVisualization && (
                                <>
                                    <Grid item xs={12}>
                                        <VisualizationSettings visualization={currentVisualization} />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <DataMappingPanel visualization={currentVisualization} />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <StreamConfigPanel visualization={currentVisualization} />
                                    </Grid>
                                </>
                            )}
                        </Grid>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};

export default VisualizationWorkspace;
