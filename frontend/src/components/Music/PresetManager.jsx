import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectParameters,
  setError,
  updateParameters,
} from "../../store/slices/audioSlice";
import styles from "./PresetManager.module.css";

const DEFAULT_PRESETS = {
  "Ambient Pad": {
    attack: 0.5,
    decay: 1.0,
    sustain: 0.8,
    release: 2.0,
    reverbDecay: 8,
    reverbWet: 0.6,
    delayTime: "8n",
    delayFeedback: 0.4,
    delayWet: 0.3,
    filterFreq: 2000,
    filterQ: 1,
    tempo: 80,
    probability: 0.6,
  },
  "Plucky Synth": {
    attack: 0.02,
    decay: 0.1,
    sustain: 0.2,
    release: 0.3,
    reverbDecay: 2,
    reverbWet: 0.2,
    delayTime: "16n",
    delayFeedback: 0.2,
    delayWet: 0.15,
    filterFreq: 5000,
    filterQ: 2,
    tempo: 120,
    probability: 0.8,
  },
  "Bass Sequence": {
    attack: 0.05,
    decay: 0.2,
    sustain: 0.4,
    release: 0.1,
    reverbDecay: 1,
    reverbWet: 0.1,
    delayTime: "8n",
    delayFeedback: 0.1,
    delayWet: 0.1,
    filterFreq: 500,
    filterQ: 4,
    tempo: 140,
    probability: 0.9,
  },
};

const PresetManager = () => {
  const dispatch = useDispatch();
  const parameters = useSelector(selectParameters);
  const [presets, setPresets] = useState(() => {
    const savedPresets = localStorage.getItem("musicPresets");
    return savedPresets
      ? { ...DEFAULT_PRESETS, ...JSON.parse(savedPresets) }
      : DEFAULT_PRESETS;
  });
  const [newPresetName, setNewPresetName] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("");

  const handleLoadPreset = (presetName) => {
    try {
      const preset = presets[presetName];
      if (preset) {
        dispatch(updateParameters(preset));
        setSelectedPreset(presetName);
      }
    } catch (error) {
      dispatch(setError("Failed to load preset: " + error.message));
    }
  };

  const handleSavePreset = () => {
    if (!newPresetName.trim()) {
      dispatch(setError("Please enter a preset name"));
      return;
    }

    try {
      const updatedPresets = {
        ...presets,
        [newPresetName]: {
          attack: parameters.attack,
          decay: parameters.decay,
          sustain: parameters.sustain,
          release: parameters.release,
          reverbDecay: parameters.reverbDecay,
          reverbWet: parameters.reverbWet,
          delayTime: parameters.delayTime,
          delayFeedback: parameters.delayFeedback,
          delayWet: parameters.delayWet,
          filterFreq: parameters.filterFreq,
          filterQ: parameters.filterQ,
          tempo: parameters.tempo,
          probability: parameters.probability,
        },
      };

      setPresets(updatedPresets);
      localStorage.setItem("musicPresets", JSON.stringify(updatedPresets));
      setNewPresetName("");
      setSelectedPreset(newPresetName);
    } catch (error) {
      dispatch(setError("Failed to save preset: " + error.message));
    }
  };

  const handleDeletePreset = (presetName) => {
    try {
      const { [presetName]: removed, ...remainingPresets } = presets;
      setPresets(remainingPresets);
      localStorage.setItem("musicPresets", JSON.stringify(remainingPresets));
      if (selectedPreset === presetName) {
        setSelectedPreset("");
      }
    } catch (error) {
      dispatch(setError("Failed to delete preset: " + error.message));
    }
  };

  const handleExportPresets = () => {
    try {
      const presetsString = JSON.stringify(presets, null, 2);
      const blob = new Blob([presetsString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "music-presets.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      dispatch(setError("Failed to export presets: " + error.message));
    }
  };

  const handleImportPresets = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedPresets = JSON.parse(e.target.result);
        const updatedPresets = { ...presets, ...importedPresets };
        setPresets(updatedPresets);
        localStorage.setItem("musicPresets", JSON.stringify(updatedPresets));
      } catch (error) {
        dispatch(setError("Failed to import presets: " + error.message));
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className={styles.presetManager}>
      <h3>Presets</h3>

      <div className={styles.presetList}>
        {Object.keys(presets).map((presetName) => (
          <div key={presetName} className={styles.presetItem}>
            <button
              className={`${styles.presetButton} ${
                selectedPreset === presetName ? styles.active : ""
              }`}
              onClick={() => handleLoadPreset(presetName)}
            >
              {presetName}
            </button>
            {!DEFAULT_PRESETS[presetName] && (
              <button
                className={styles.deleteButton}
                onClick={() => handleDeletePreset(presetName)}
                title="Delete preset"
              >
                <i className="fas fa-times" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className={styles.savePreset}>
        <input
          type="text"
          placeholder="New preset name"
          value={newPresetName}
          onChange={(e) => setNewPresetName(e.target.value)}
          className={styles.presetInput}
        />
        <button
          className={styles.saveButton}
          onClick={handleSavePreset}
          disabled={!newPresetName.trim()}
        >
          Save
        </button>
      </div>

      <div className={styles.importExport}>
        <button
          className={styles.exportButton}
          onClick={handleExportPresets}
          title="Export presets"
        >
          <i className="fas fa-download" />
          <span>Export</span>
        </button>

        <label className={styles.importButton}>
          <i className="fas fa-upload" />
          <span>Import</span>
          <input
            type="file"
            accept=".json"
            onChange={handleImportPresets}
            style={{ display: "none" }}
          />
        </label>
      </div>
    </div>
  );
};

export default PresetManager;
