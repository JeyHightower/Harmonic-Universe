import React, { useEffect, useState } from "react";
import styles from "./AudioControls.module.css";

const AudioControls = ({
  harmony = 0.5,
  tempo = 120,
  musicalKey = "C",
  scale = "major",
  onParameterChange,
  isLoading = false,
  error = null,
}) => {
  const [viewClass, setViewClass] = useState(styles["_desktop-view_ff8cf6"]);
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      setViewClass(
        window.innerWidth < 768
          ? styles["_mobile-view_ff8cf6"]
          : styles["_desktop-view_ff8cf6"],
      );
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleParameterChange = (name, value) => {
    let error = null;
    if (name === "harmony" && (value < 0 || value > 1)) {
      error = "Harmony must be between 0 and 1";
    } else if (name === "tempo" && (value < 60 || value > 200)) {
      error = "Tempo must be between 60 and 200";
    }

    setValidationError(error);
    if (!error) {
      onParameterChange(name, value);
    }
  };

  return (
    <div className={`${styles.container} ${viewClass}`}>
      <h2>Audio Controls</h2>
      <h3>About Audio Controls</h3>
      {isLoading && (
        <div data-testid="loading-indicator" className={styles.loading}>
          Loading...
        </div>
      )}
      {error && (
        <div data-testid="error-message" className={styles.error}>
          {error}
        </div>
      )}
      {validationError && (
        <div data-testid="validation-error" className={styles.error}>
          {validationError}
        </div>
      )}
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label htmlFor="harmony">Harmony</label>
          <input
            type="range"
            id="harmony"
            name="harmony"
            min="0"
            max="1"
            step="0.1"
            value={harmony}
            onChange={(e) =>
              handleParameterChange("harmony", parseFloat(e.target.value))
            }
            disabled={isLoading}
          />
        </div>
        <div className={styles.controlGroup}>
          <label htmlFor="tempo">Tempo</label>
          <input
            type="range"
            id="tempo"
            name="tempo"
            min="60"
            max="200"
            value={tempo}
            onChange={(e) =>
              handleParameterChange("tempo", parseInt(e.target.value, 10))
            }
            disabled={isLoading}
          />
        </div>
        <div className={styles.controlGroup}>
          <label htmlFor="musicalKey">Key</label>
          <select
            id="musicalKey"
            name="musicalKey"
            value={musicalKey}
            onChange={(e) =>
              handleParameterChange("musicalKey", e.target.value)
            }
            disabled={isLoading}
          >
            <option value="C">C</option>
            <option value="G">G</option>
            <option value="D">D</option>
            <option value="A">A</option>
            <option value="E">E</option>
            <option value="B">B</option>
            <option value="F#">F#</option>
            <option value="C#">C#</option>
          </select>
        </div>
        <div className={styles.controlGroup}>
          <label htmlFor="scale">Scale</label>
          <select
            id="scale"
            name="scale"
            value={scale}
            onChange={(e) => handleParameterChange("scale", e.target.value)}
            disabled={isLoading}
          >
            <option value="major">Major</option>
            <option value="minor">Minor</option>
          </select>
        </div>
      </div>
      <div className={styles.infoPanel}>
        <p>
          Adjust harmony, tempo, key, and scale to customize your audio
          experience.
        </p>
      </div>
    </div>
  );
};

export default AudioControls;
