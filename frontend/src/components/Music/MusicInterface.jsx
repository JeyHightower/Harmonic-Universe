import { Grid, Paper, Typography } from "@mui/material";
import React from "react";
import AIControls from "./AIControls";
import AudioControls from "./AudioControls";
import AudioParameters from "./AudioParameters";
import styles from "./MusicInterface.module.css";
import MusicPlayer from "./MusicPlayer";

const MusicInterface = ({ universeId }) => {
  return (
    <div className={styles.container}>
      <Typography variant="h4" gutterBottom>
        Music Studio
      </Typography>

      <Grid container spacing={3}>
        {/* Main Controls */}
        <Grid item xs={12} md={8}>
          <Paper className={styles.paper}>
            <MusicPlayer />
            <AudioControls />
          </Paper>
        </Grid>

        {/* AI Controls */}
        <Grid item xs={12} md={4}>
          <Paper className={styles.paper}>
            <AIControls currentUniverseId={universeId} />
          </Paper>
        </Grid>

        {/* Audio Parameters */}
        <Grid item xs={12}>
          <Paper className={styles.paper}>
            <AudioParameters />
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};

export default MusicInterface;
