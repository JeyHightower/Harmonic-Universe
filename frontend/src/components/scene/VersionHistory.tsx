import CompareIcon from '@mui/icons-material/Compare';
import RestoreIcon from '@mui/icons-material/Restore';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Tooltip,
    Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useVersionControl } from '../../hooks/useVersionControl';

interface VersionHistoryProps {
    sceneId: string | undefined;
}

interface Version {
    id: string;
    message: string;
    userId: string;
    username: string;
    createdAt: string;
    changes: {
        type: 'initial' | 'update';
        added?: string[];
        removed?: string[];
        modified?: string[];
    };
}

const VersionHistory: React.FC<VersionHistoryProps> = ({ sceneId }) => {
    const [versions, setVersions] = useState<Version[]>([]);
    const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
    const [compareMode, setCompareMode] = useState(false);
    const [compareVersion, setCompareVersion] = useState<Version | null>(null);
    const [diffDialog, setDiffDialog] = useState(false);

    const {
        getHistory,
        restoreVersion,
        compareVersions,
    } = useVersionControl();

    useEffect(() => {
        if (sceneId) {
            loadHistory();
        }
    }, [sceneId]);

    const loadHistory = async () => {
        if (!sceneId) return;
        const history = await getHistory(sceneId);
        setVersions(history);
    };

    const handleRestore = async (version: Version) => {
        if (!sceneId) return;
        await restoreVersion(sceneId, version.id);
        loadHistory();
    };

    const handleCompare = async () => {
        if (!selectedVersion || !compareVersion) return;
        const diff = await compareVersions(selectedVersion.id, compareVersion.id);
        // Show diff in dialog
        setDiffDialog(true);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
            <Typography variant="h6" gutterBottom>
                Version History
            </Typography>

            {compareMode ? (
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="primary">
                        Select a version to compare with {selectedVersion?.message}
                    </Typography>
                    <Button
                        size="small"
                        onClick={() => {
                            setCompareMode(false);
                            setCompareVersion(null);
                        }}
                    >
                        Cancel
                    </Button>
                </Box>
            ) : null}

            <List sx={{ flex: 1, overflow: 'auto' }}>
                {versions.map((version) => (
                    <ListItem
                        key={version.id}
                        selected={selectedVersion?.id === version.id}
                        onClick={() => {
                            if (compareMode) {
                                setCompareVersion(version);
                                handleCompare();
                            } else {
                                setSelectedVersion(version);
                            }
                        }}
                    >
                        <ListItemText
                            primary={version.message}
                            secondary={`${version.username} - ${formatDate(version.createdAt)}`}
                        />
                        {!compareMode && (
                            <Box>
                                <Tooltip title="Compare">
                                    <IconButton
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedVersion(version);
                                            setCompareMode(true);
                                        }}
                                    >
                                        <CompareIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Restore">
                                    <IconButton
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRestore(version);
                                        }}
                                    >
                                        <RestoreIcon />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        )}
                    </ListItem>
                ))}
            </List>

            <Dialog
                open={diffDialog}
                onClose={() => setDiffDialog(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Version Comparison</DialogTitle>
                <DialogContent>
                    {selectedVersion && compareVersion && (
                        <Box>
                            <Typography variant="subtitle1" gutterBottom>
                                Changes between versions:
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                From: {formatDate(selectedVersion.createdAt)}
                            </Typography>
                            <Typography variant="body2" color="textSecondary" gutterBottom>
                                To: {formatDate(compareVersion.createdAt)}
                            </Typography>

                            {/* Display changes */}
                            {compareVersion.changes.added?.length ? (
                                <Box sx={{ mt: 2 }}>
                                    <Typography color="success.main">Added:</Typography>
                                    <List dense>
                                        {compareVersion.changes.added.map((item) => (
                                            <ListItem key={item}>
                                                <ListItemText primary={item} />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Box>
                            ) : null}

                            {compareVersion.changes.removed?.length ? (
                                <Box sx={{ mt: 2 }}>
                                    <Typography color="error.main">Removed:</Typography>
                                    <List dense>
                                        {compareVersion.changes.removed.map((item) => (
                                            <ListItem key={item}>
                                                <ListItemText primary={item} />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Box>
                            ) : null}

                            {compareVersion.changes.modified?.length ? (
                                <Box sx={{ mt: 2 }}>
                                    <Typography color="info.main">Modified:</Typography>
                                    <List dense>
                                        {compareVersion.changes.modified.map((item) => (
                                            <ListItem key={item}>
                                                <ListItemText primary={item} />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Box>
                            ) : null}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDiffDialog(false)}>Close</Button>
                    <Button
                        variant="contained"
                        onClick={() => {
                            if (compareVersion) {
                                handleRestore(compareVersion);
                            }
                            setDiffDialog(false);
                        }}
                    >
                        Restore This Version
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default VersionHistory;
