import { Box, Grid, Paper } from '@mui/material';
import { RootState } from '@store/index';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import DataMappingPanel from './DataMappingPanel';
import StreamConfigPanel from './StreamConfigPanel';
import VisualizationCanvas from './VisualizationCanvas';
import VisualizationList from './VisualizationList';

const VisualizationWorkspace: React.FC = () => {
    const [selectedVisualizationId, setSelectedVisualizationId] = useState<number | null>(null);
    const visualization = useSelector((state: RootState) =>
        state.visualization.visualizations.find((v) => v.id === selectedVisualizationId)
    );

    const handleVisualizationSelect = (id: number) => {
        setSelectedVisualizationId(id);
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Grid container spacing={2} sx={{ flexGrow: 1, overflow: 'hidden' }}>
                <Grid item xs={3}>
                    <Paper sx={{ height: '100%', overflow: 'auto' }}>
                        <VisualizationList
                            selectedVisualizationId={selectedVisualizationId}
                            onVisualizationSelect={handleVisualizationSelect}
                        />
                    </Paper>
                </Grid>
                <Grid item xs={6}>
                    <Paper
                        sx={{
                            height: '100%',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <VisualizationCanvas
                            visualization={visualization}
                        />
                    </Paper>
                </Grid>
                <Grid item xs={3}>
                    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Paper sx={{ flexGrow: 1, overflow: 'auto' }}>
                            <DataMappingPanel
                                visualization={visualization}
                            />
                        </Paper>
                        <Paper sx={{ height: '40%', overflow: 'auto' }}>
                            <StreamConfigPanel
                                visualization={visualization}
                            />
                        </Paper>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};

export default VisualizationWorkspace;
