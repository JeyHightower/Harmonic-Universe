import {
    Box,
    Paper,
    Stack,
    Tab,
    Tabs,
    Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useState } from 'react';
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

interface ResultsViewerProps {
    model: {
        id: number;
        metrics: {
            [key: string]: any;
        };
        training_sessions?: Array<{
            id: number;
            start_time: number;
            end_time?: number;
            status: string;
            metrics: {
                [key: string]: any;
            };
            validation_results: {
                [key: string]: any;
            };
            error_message?: string;
        }>;
    } | null;
}

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
            id={`results-tabpanel-${index}`}
            aria-labelledby={`results-tab-${index}`}
            {...other}
            style={{ height: '100%', overflow: 'auto' }}
        >
            {value === index && (
                <Box sx={{ p: 2 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

const ResultsViewer: React.FC<ResultsViewerProps> = ({ model }) => {
    const theme = useTheme();
    const [selectedTab, setSelectedTab] = useState(0);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setSelectedTab(newValue);
    };

    const renderMetricsChart = (metrics: { [key: string]: any }) => {
        const data = Object.entries(metrics).map(([key, value]) => ({
            name: key,
            value: typeof value === 'number' ? value : 0,
        }));

        return (
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        );
    };

    if (!model) {
        return (
            <Box sx={{ p: 2 }}>
                <Typography variant="subtitle1" color="text.secondary">
                    Select a model to view results
                </Typography>
            </Box>
        );
    }

    const latestSession = model.training_sessions?.slice(-1)[0];

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={selectedTab} onChange={handleTabChange}>
                    <Tab label="Overview" />
                    <Tab label="Training" />
                    <Tab label="Validation" />
                </Tabs>
            </Box>

            <TabPanel value={selectedTab} index={0}>
                <Stack spacing={3}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Model Status
                        </Typography>
                        <Typography variant="h6" color="primary">
                            {model.status}
                        </Typography>
                    </Paper>

                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Latest Metrics
                        </Typography>
                        {renderMetricsChart(model.metrics)}
                    </Paper>

                    {latestSession && (
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Latest Training Session
                            </Typography>
                            <Stack spacing={1}>
                                <Typography>
                                    Status: {latestSession.status}
                                </Typography>
                                <Typography>
                                    Started:{' '}
                                    {new Date(latestSession.start_time).toLocaleString()}
                                </Typography>
                                {latestSession.end_time && (
                                    <Typography>
                                        Ended:{' '}
                                        {new Date(latestSession.end_time).toLocaleString()}
                                    </Typography>
                                )}
                                {latestSession.error_message && (
                                    <Typography color="error">
                                        Error: {latestSession.error_message}
                                    </Typography>
                                )}
                            </Stack>
                        </Paper>
                    )}
                </Stack>
            </TabPanel>

            <TabPanel value={selectedTab} index={1}>
                <Stack spacing={3}>
                    {model.training_sessions?.map((session) => (
                        <Paper key={session.id} sx={{ p: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Training Session {session.id}
                            </Typography>
                            <Stack spacing={2}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Training Metrics
                                    </Typography>
                                    {renderMetricsChart(session.metrics)}
                                </Box>

                                <Stack spacing={1}>
                                    <Typography>
                                        Status: {session.status}
                                    </Typography>
                                    <Typography>
                                        Started:{' '}
                                        {new Date(session.start_time).toLocaleString()}
                                    </Typography>
                                    {session.end_time && (
                                        <Typography>
                                            Ended:{' '}
                                            {new Date(session.end_time).toLocaleString()}
                                        </Typography>
                                    )}
                                    {session.error_message && (
                                        <Typography color="error">
                                            Error: {session.error_message}
                                        </Typography>
                                    )}
                                </Stack>
                            </Stack>
                        </Paper>
                    ))}
                </Stack>
            </TabPanel>

            <TabPanel value={selectedTab} index={2}>
                <Stack spacing={3}>
                    {model.training_sessions?.map((session) => (
                        <Paper key={session.id} sx={{ p: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Validation Results - Session {session.id}
                            </Typography>
                            <Stack spacing={2}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Validation Metrics
                                    </Typography>
                                    {renderMetricsChart(session.validation_results)}
                                </Box>

                                <Stack spacing={1}>
                                    <Typography>
                                        Status: {session.status}
                                    </Typography>
                                    {session.error_message && (
                                        <Typography color="error">
                                            Error: {session.error_message}
                                        </Typography>
                                    )}
                                </Stack>
                            </Stack>
                        </Paper>
                    ))}
                </Stack>
            </TabPanel>
        </Box>
    );
};

export default ResultsViewer;
