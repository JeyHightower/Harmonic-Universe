import PropTypes from "prop-types";
import React, { useMemo } from "react";
import useControlPanel from "../../hooks/useControlPanel";
import BaseControlPanel from "../Common/BaseControlPanel";
import "./MusicControlPanel.css";

const DEFAULT_VALUES = {
  harmony: 0.5,
  tempo: 120,
  key: "C",
  scale: "major",
};

const KEYS = [
  "C",
  "G",
  "D",
  "A",
  "E",
  "B",
  "F#",
  "C#",
  "F",
  "Bb",
  "Eb",
  "Ab",
  "Db",
  "Gb",
];

const SCALES = [
  "major",
  "minor",
  "harmonic minor",
  "melodic minor",
  "pentatonic",
  "blues",
];

const MUSIC_CONTROLS = [
  {
    id: "harmony",
    label: "Harmony",
    type: "range",
    min: 0,
    max: 1,
    step: 0.01,
    valueType: "number",
  },
  {
    id: "tempo",
    label: "Tempo (BPM)",
    type: "range",
    min: 60,
    max: 200,
    step: 1,
    valueType: "number",
    unit: "BPM",
  },
  {
    id: "key",
    label: "Key",
    type: "select",
    options: KEYS.map((key) => ({ value: key, label: key })),
  },
  {
    id: "scale",
    label: "Scale",
    type: "select",
    options: SCALES.map((scale) => ({ value: scale, label: scale })),
  },
];

const MUSIC_INFO = [
  "Harmony controls the complexity of chord progressions",
  "Tempo sets the speed of the music in beats per minute",
  "Key determines the tonal center of the music",
  "Scale defines the set of notes used in melodies",
];

const MusicControlPanel = ({ initialValues, onChange }) => {
  // Memoize controls configuration
  const controls = useMemo(() => MUSIC_CONTROLS, []);
  const infoItems = useMemo(() => MUSIC_INFO, []);

  const { parameters, updateParameter } = useControlPanel(
    initialValues,
    DEFAULT_VALUES,
    onChange,
  );

  return (
    <BaseControlPanel
      title="Music"
      controls={controls}
      values={parameters}
      onChange={updateParameter}
      infoItems={infoItems}
      className="music-control-panel"
    />
  );
};

MusicControlPanel.propTypes = {
  initialValues: PropTypes.shape({
    harmony: PropTypes.number,
    tempo: PropTypes.number,
    key: PropTypes.string,
    scale: PropTypes.string,
  }),
  onChange: PropTypes.func,
};

export default React.memo(MusicControlPanel);
