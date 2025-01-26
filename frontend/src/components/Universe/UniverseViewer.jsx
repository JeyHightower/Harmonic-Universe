import { useAuth } from "@/hooks/useAuth";
import { useUI } from "@/hooks/useUI";
import { useUniverse } from "@/hooks/useUniverse";
import {
  Edit as EditIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Favorite as FavoriteIcon,
  Share as ShareIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Grid,
  IconButton,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { format } from "date-fns";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import CommentSection from "./CommentSection";
import ParameterManager from "./ParameterManager";
import ShareDialog from "./ShareDialog";
import UniverseOverview from "./UniverseOverview";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`universe-tabpanel-${index}`}
      aria-labelledby={`universe-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const UniverseViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { showAlert } = useUI();
  const {
    currentUniverse,
    isLoading,
    error,
    handleFetchUniverseById,
    handleToggleFavorite,
  } = useUniverse();

  const [activeTab, setActiveTab] = useState(0);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      handleFetchUniverseById(parseInt(id));
    }
  }, [id, handleFetchUniverseById]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleShare = () => {
    setShareDialogOpen(true);
  };

  const handleFavorite = async () => {
    if (!currentUniverse) return;
    try {
      await handleToggleFavorite(currentUniverse.id);
      showAlert({
        type: "success",
        message: currentUniverse.is_favorited
          ? "Removed from favorites"
          : "Added to favorites",
      });
    } catch (error) {
      showAlert({
        type: "error",
        message: "Failed to update favorite status",
      });
    }
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !currentUniverse) {
    return (
      <Container>
        <Typography color="error" align="center">
          {error || "Universe not found"}
        </Typography>
      </Container>
    );
  }

  const isOwner = user?.id === currentUniverse.creator_id;

  return (
    <Container maxWidth="lg">
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs>
              <Typography variant="h4" component="h1" gutterBottom>
                {currentUniverse.name}
              </Typography>
              <Typography color="text.secondary" gutterBottom>
                Created by {currentUniverse.creator?.username} on{" "}
                {format(new Date(currentUniverse.created_at), "PPP")}
              </Typography>
            </Grid>
            <Grid item>
              <Box sx={{ display: "flex", gap: 1 }}>
                <IconButton onClick={handleFavorite} color="primary">
                  {currentUniverse.is_favorited ? (
                    <FavoriteIcon />
                  ) : (
                    <FavoriteBorderIcon />
                  )}
                </IconButton>
                <IconButton onClick={handleShare} color="primary">
                  <ShareIcon />
                </IconButton>
                {isOwner && (
                  <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    href={`/universe/${currentUniverse.id}/edit`}
                  >
                    Edit
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Overview" />
          <Tab label="Parameters" />
          <Tab label="Comments" />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        <UniverseOverview universe={currentUniverse} />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <ParameterManager universeId={currentUniverse.id} />
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <CommentSection universeId={currentUniverse.id} />
      </TabPanel>

      <ShareDialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        universeId={currentUniverse.id}
      />
    </Container>
  );
};

export default UniverseViewer;
