import {
    CloudDownload as CloudDownloadIcon,
    Code as CodeIcon,
    History as HistoryIcon,
    TableChart as TableChartIcon
} from '@mui/icons-material';
import {
    Box,
    Button,
    Card,
    CardContent,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Typography,
    alpha,
    styled,
    useTheme
} from '@mui/material';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { RootState } from '../../store';

// Styled components
const ExportCard = styled(Card)(({ theme }) => ({
  background: alpha(theme.palette.background.paper, 0.8),
  backdropFilter: 'blur(10px)',
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8]
  }
}));

const ExportButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(1),
  minWidth: 200,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1)
}));

interface ExportOption {
  type: string;
  format: 'json' | 'csv';
}

const UniverseExport: React.FC = () => {
  const theme = useTheme();
  const { id } = useParams<{ id: string }>();
  const [exportOption, setExportOption] = useState<ExportOption>({
    type: 'universe',
    format: 'json'
  });

  const universe = useSelector((state: RootState) =>
    state.universes.universes.find(u => u.id === Number(id))
  );

  const handleExport = async () => {
    try {
      const { type, format } = exportOption;
      let endpoint = '';

      switch (type) {
        case 'universe':
          endpoint = `/api/export/universe/${id}?format=${format}`;
          break;
        case 'physics':
        case 'music':
        case 'visual':
          endpoint = `/api/export/parameters/${id}?type=${type}&format=${format}`;
          break;
        case 'activity':
          endpoint = `/api/export/activity/${id}?format=${format}`;
          break;
      }

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error('Export failed');
      }

      if (format === 'json') {
        const data = await response.json();
        // Create and download JSON file
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${universe?.name}_${type}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        // For CSV, the response is already a file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${universe?.name}_${type}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
      // Handle error (show notification, etc.)
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <ExportCard>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Export Universe Data
          </Typography>

          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Export Type</InputLabel>
              <Select
                value={exportOption.type}
                label="Export Type"
                onChange={(e) => setExportOption({ ...exportOption, type: e.target.value })}
              >
                <MenuItem value="universe">Complete Universe</MenuItem>
                <MenuItem value="physics">Physics Parameters</MenuItem>
                <MenuItem value="music">Music Parameters</MenuItem>
                <MenuItem value="visual">Visual Parameters</MenuItem>
                <MenuItem value="activity">Activity History</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Format</InputLabel>
              <Select
                value={exportOption.format}
                label="Format"
                onChange={(e) => setExportOption({ ...exportOption, format: e.target.value as 'json' | 'csv' })}
              >
                <MenuItem value="json">JSON</MenuItem>
                <MenuItem value="csv">CSV</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
            <ExportButton
              variant="contained"
              color="primary"
              onClick={handleExport}
              startIcon={<CloudDownloadIcon />}
            >
              Export {exportOption.type} as {exportOption.format.toUpperCase()}
            </ExportButton>
          </Box>
        </CardContent>
      </ExportCard>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
        <ExportButton
          variant="outlined"
          startIcon={<CodeIcon />}
          onClick={() => setExportOption({ type: 'universe', format: 'json' })}
        >
          Complete Universe
        </ExportButton>

        <ExportButton
          variant="outlined"
          startIcon={<TableChartIcon />}
          onClick={() => setExportOption({ type: 'physics', format: 'csv' })}
        >
          Parameters
        </ExportButton>

        <ExportButton
          variant="outlined"
          startIcon={<HistoryIcon />}
          onClick={() => setExportOption({ type: 'activity', format: 'json' })}
        >
          Activity History
        </ExportButton>
      </Box>
    </Box>
  );
};

export default UniverseExport;
