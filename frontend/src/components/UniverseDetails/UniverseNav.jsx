import { Brush, MusicNote, Science } from "@mui/icons-material";
import { Box, Button, ButtonGroup } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";

const UniverseNav = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <Box sx={{ mb: 4 }}>
      <ButtonGroup variant="outlined" aria-label="universe navigation">
        <Button
          startIcon={<Science />}
          onClick={() => navigate(`/universes/${id}/physics`)}
        >
          Physics
        </Button>
        <Button
          startIcon={<MusicNote />}
          onClick={() => navigate(`/universes/${id}/music`)}
        >
          Music
        </Button>
        <Button
          startIcon={<Brush />}
          onClick={() => navigate(`/universes/${id}/visualization`)}
        >
          Visualization
        </Button>
      </ButtonGroup>
    </Box>
  );
};

export default UniverseNav;
