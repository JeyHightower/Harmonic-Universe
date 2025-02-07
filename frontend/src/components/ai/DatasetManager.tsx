import { useDatasets } from '@hooks/useDatasets';
import {
    CloudUpload,
    Delete as DeleteIcon,
    ExpandMore,
    Preview as PreviewIcon,
    QueryStats as StatsIcon,
} from '@mui/icons-material';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    Chip,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Stack,
    Typography
} from '@mui/material';
import React, { useRef, useState } from 'react';

interface DatasetManagerProps {
    modelType?: string;
    onSelectDataset?: (datasetId: number) => void;
}

const DatasetManager: React.FC<DatasetManagerProps> = ({ modelType, onSelectDataset }) => {
    const { datasets, uploadDataset, getDatasetPreview, getDatasetStats, deleteDataset } =
        useDatasets();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [expandedDataset, setExpandedDataset] = useState<number | null>(null);
    const [previewData, setPreviewData] = useState<any>(null);
    const [statsData, setStatsData] = useState<any>(null);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const metadata = {
            name: file.name.split('.')[0],
            description: '',
            data_type: modelType || 'generic',
            format: file.name.split('.').pop() || 'unknown',
        };

        await uploadDataset(file, metadata);
    };

    const handlePreviewClick = async (datasetId: number) => {
        const preview = await getDatasetPreview(datasetId);
        setPreviewData(preview);
        setExpandedDataset(datasetId);
    };

    const handleStatsClick = async (datasetId: number) => {
        const stats = await getDatasetStats(datasetId);
        setStatsData(stats);
        setExpandedDataset(datasetId);
    };

    const handleDeleteClick = async (datasetId: number) => {
        if (window.confirm('Are you sure you want to delete this dataset?')) {
            await deleteDataset(datasetId);
            if (expandedDataset === datasetId) {
                setExpandedDataset(null);
                setPreviewData(null);
                setStatsData(null);
            }
        }
    };

    const formatSize = (bytes: number) => {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
            <Stack spacing={3}>
                <Box>
                    <Typography variant="h6" gutterBottom>
                        Datasets
                    </Typography>
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleFileSelect}
                    />
                    <Button
                        startIcon={<CloudUpload />}
                        onClick={() => fileInputRef.current?.click()}
                        variant="contained"
                        fullWidth
                    >
                        Upload Dataset
                    </Button>
                </Box>

                <List sx={{ flexGrow: 1, overflow: 'auto' }}>
                    {datasets.map(dataset => (
                        <Accordion
                            key={dataset.id}
                            expanded={expandedDataset === dataset.id}
                            onChange={(_, isExpanded) =>
                                setExpandedDataset(isExpanded ? dataset.id : null)
                            }
                        >
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Stack spacing={1} sx={{ width: '100%' }}>
                                    <Stack
                                        direction="row"
                                        spacing={2}
                                        alignItems="center"
                                        justifyContent="space-between"
                                    >
                                        <Typography>{dataset.name}</Typography>
                                        <Stack direction="row" spacing={1}>
                                            <Chip
                                                label={dataset.data_type}
                                                size="small"
                                                color="primary"
                                            />
                                            <Chip
                                                label={formatSize(dataset.size)}
                                                size="small"
                                            />
                                        </Stack>
                                    </Stack>
                                    <Typography variant="body2" color="text.secondary">
                                        {dataset.description || 'No description'}
                                    </Typography>
                                </Stack>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Stack spacing={2}>
                                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                                        <Button
                                            startIcon={<PreviewIcon />}
                                            onClick={() => handlePreviewClick(dataset.id)}
                                            size="small"
                                        >
                                            Preview
                                        </Button>
                                        <Button
                                            startIcon={<StatsIcon />}
                                            onClick={() => handleStatsClick(dataset.id)}
                                            size="small"
                                        >
                                            Statistics
                                        </Button>
                                        {onSelectDataset && (
                                            <Button
                                                onClick={() => onSelectDataset(dataset.id)}
                                                size="small"
                                                variant="contained"
                                            >
                                                Select
                                            </Button>
                                        )}
                                        <IconButton
                                            onClick={() => handleDeleteClick(dataset.id)}
                                            color="error"
                                            size="small"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Stack>

                                    {previewData && expandedDataset === dataset.id && (
                                        <Box>
                                            <Typography variant="subtitle2" gutterBottom>
                                                Preview
                                            </Typography>
                                            <Box
                                                sx={{
                                                    maxHeight: 200,
                                                    overflow: 'auto',
                                                    bgcolor: 'background.paper',
                                                    p: 1,
                                                    borderRadius: 1,
                                                }}
                                            >
                                                <pre>
                                                    {JSON.stringify(previewData, null, 2)}
                                                </pre>
                                            </Box>
                                        </Box>
                                    )}

                                    {statsData && expandedDataset === dataset.id && (
                                        <Box>
                                            <Typography variant="subtitle2" gutterBottom>
                                                Statistics
                                            </Typography>
                                            <List dense>
                                                {Object.entries(statsData).map(([key, value]) => (
                                                    <ListItem key={key}>
                                                        <ListItemText
                                                            primary={key}
                                                            secondary={JSON.stringify(value)}
                                                        />
                                                    </ListItem>
                                                ))}
                                            </List>
                                        </Box>
                                    )}

                                    <Box>
                                        <Typography variant="subtitle2" gutterBottom>
                                            Features
                                        </Typography>
                                        <List dense>
                                            {Object.entries(dataset.features).map(([key, value]) => (
                                                <ListItem key={key}>
                                                    <ListItemText
                                                        primary={key}
                                                        secondary={JSON.stringify(value)}
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>
                                    </Box>

                                    <Box>
                                        <Typography variant="subtitle2" gutterBottom>
                                            Metadata
                                        </Typography>
                                        <List dense>
                                            {Object.entries(dataset.metadata).map(([key, value]) => (
                                                <ListItem key={key}>
                                                    <ListItemText
                                                        primary={key}
                                                        secondary={JSON.stringify(value)}
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>
                                    </Box>
                                </Stack>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </List>
            </Stack>
        </Box>
    );
};

export default DatasetManager;
