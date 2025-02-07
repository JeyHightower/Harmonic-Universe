import { useAITraining } from '@hooks/useAITraining';
import { useModelExperiments } from '@hooks/useModelExperiments';
import { useModelMonitoring } from '@hooks/useModelMonitoring';
import { useModelPipelines } from '@hooks/useModelPipelines';
import { useModelServing } from '@hooks/useModelServing';
import { useModelVersioning } from '@hooks/useModelVersioning';
import {
    Box,
    Grid,
    Paper,
    Tab,
    Tabs,
} from '@mui/material';
import { RootState } from '@store/index';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import DatasetManager from './DatasetManager';
import ExperimentPanel from './ExperimentPanel';
import ModelList from './ModelList';
import ModelServing from './ModelServing';
import ResultsViewer from './ResultsViewer';
import TrainingPanel from './TrainingPanel';

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
            id={`ai-workspace-tabpanel-${index}`}
            aria-labelledby={`ai-workspace-tab-${index}`}
            {...other}
            style={{ height: '100%', overflow: 'auto' }}
        >
            {value === index && children}
        </div>
    );
}

const AIWorkspace: React.FC = () => {
    const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
    const [selectedTab, setSelectedTab] = useState(0);
    const model = useSelector((state: RootState) =>
        state.ai.models.find((m) => m.id === selectedModelId)
    );

    // Initialize hooks
    const training = useAITraining(selectedModelId);
    const monitoring = useModelMonitoring(selectedModelId);
    const experiments = useModelExperiments(selectedModelId);
    const versioning = useModelVersioning(selectedModelId);
    const pipelines = useModelPipelines(selectedModelId);
    const serving = useModelServing(selectedModelId);

    const handleModelSelect = (id: number) => {
        setSelectedModelId(id);
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setSelectedTab(newValue);
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Grid container spacing={2} sx={{ flexGrow: 1, overflow: 'hidden' }}>
                <Grid item xs={3}>
                    <Paper sx={{ height: '100%', overflow: 'auto' }}>
                        <ModelList
                            selectedModelId={selectedModelId}
                            onModelSelect={handleModelSelect}
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
                        <Tabs
                            value={selectedTab}
                            onChange={handleTabChange}
                            variant="scrollable"
                            scrollButtons="auto"
                            sx={{ borderBottom: 1, borderColor: 'divider' }}
                        >
                            <Tab label="Training" />
                            <Tab label="Experiments" />
                            <Tab label="Serving" />
                            <Tab label="Datasets" />
                        </Tabs>

                        <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                            <TabPanel value={selectedTab} index={0}>
                                <TrainingPanel
                                    model={model}
                                    training={training}
                                    experiments={experiments}
                                    versioning={versioning}
                                    pipelines={pipelines}
                                    serving={serving}
                                />
                            </TabPanel>

                            <TabPanel value={selectedTab} index={1}>
                                <ExperimentPanel model={model} />
                            </TabPanel>

                            <TabPanel value={selectedTab} index={2}>
                                <ModelServing model={model} />
                            </TabPanel>

                            <TabPanel value={selectedTab} index={3}>
                                <DatasetManager
                                    modelType={model?.model_type}
                                    onSelectDataset={(datasetId) => {
                                        // Handle dataset selection
                                        setSelectedTab(0); // Switch back to training tab
                                    }}
                                />
                            </TabPanel>
                        </Box>
                    </Paper>
                </Grid>
                <Grid item xs={3}>
                    <Paper sx={{ height: '100%', overflow: 'auto' }}>
                        <ResultsViewer
                            model={model}
                            training={training}
                            monitoring={monitoring}
                            experiments={experiments}
                        />
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AIWorkspace;
