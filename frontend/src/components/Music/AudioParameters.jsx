import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectParameters,
  updateParameters,
} from "../../store/slices/audioSlice";
import styles from "./AudioParameters.module.css";

const AudioParameters = () => {
  const dispatch = useDispatch();
  const parameters = useSelector(selectParameters);

  const handleChange = (paramName, value) => {
    dispatch(updateParameters({ [paramName]: value }));
  };

  return (
    <div className={styles.parameters}>
      <h3>Synthesis Parameters</h3>

      <div className={styles.section}>
        <h4>Envelope</h4>
        <div className={styles.controls}>
          <div className={styles.control}>
            <label htmlFor="attack">Attack</label>
            <input
              type="range"
              id="attack"
              min="0.01"
              max="2"
              step="0.01"
              value={parameters.attack}
              onChange={(e) =>
                handleChange("attack", parseFloat(e.target.value))
              }
            />
            <span>{parameters.attack.toFixed(2)}s</span>
          </div>

          <div className={styles.control}>
            <label htmlFor="decay">Decay</label>
            <input
              type="range"
              id="decay"
              min="0.01"
              max="2"
              step="0.01"
              value={parameters.decay}
              onChange={(e) =>
                handleChange("decay", parseFloat(e.target.value))
              }
            />
            <span>{parameters.decay.toFixed(2)}s</span>
          </div>

          <div className={styles.control}>
            <label htmlFor="sustain">Sustain</label>
            <input
              type="range"
              id="sustain"
              min="0"
              max="1"
              step="0.01"
              value={parameters.sustain}
              onChange={(e) =>
                handleChange("sustain", parseFloat(e.target.value))
              }
            />
            <span>{parameters.sustain.toFixed(2)}</span>
          </div>

          <div className={styles.control}>
            <label htmlFor="release">Release</label>
            <input
              type="range"
              id="release"
              min="0.01"
              max="4"
              step="0.01"
              value={parameters.release}
              onChange={(e) =>
                handleChange("release", parseFloat(e.target.value))
              }
            />
            <span>{parameters.release.toFixed(2)}s</span>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h4>Effects</h4>
        <div className={styles.controls}>
          <div className={styles.control}>
            <label htmlFor="reverbDecay">Reverb Decay</label>
            <input
              type="range"
              id="reverbDecay"
              min="0.1"
              max="10"
              step="0.1"
              value={parameters.reverbDecay}
              onChange={(e) =>
                handleChange("reverbDecay", parseFloat(e.target.value))
              }
            />
            <span>{parameters.reverbDecay.toFixed(1)}s</span>
          </div>

          <div className={styles.control}>
            <label htmlFor="reverbWet">Reverb Mix</label>
            <input
              type="range"
              id="reverbWet"
              min="0"
              max="1"
              step="0.01"
              value={parameters.reverbWet}
              onChange={(e) =>
                handleChange("reverbWet", parseFloat(e.target.value))
              }
            />
            <span>{Math.round(parameters.reverbWet * 100)}%</span>
          </div>

          <div className={styles.control}>
            <label htmlFor="delayFeedback">Delay Feedback</label>
            <input
              type="range"
              id="delayFeedback"
              min="0"
              max="0.9"
              step="0.01"
              value={parameters.delayFeedback}
              onChange={(e) =>
                handleChange("delayFeedback", parseFloat(e.target.value))
              }
            />
            <span>{Math.round(parameters.delayFeedback * 100)}%</span>
          </div>

          <div className={styles.control}>
            <label htmlFor="delayWet">Delay Mix</label>
            <input
              type="range"
              id="delayWet"
              min="0"
              max="1"
              step="0.01"
              value={parameters.delayWet}
              onChange={(e) =>
                handleChange("delayWet", parseFloat(e.target.value))
              }
            />
            <span>{Math.round(parameters.delayWet * 100)}%</span>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h4>Filter</h4>
        <div className={styles.controls}>
          <div className={styles.control}>
            <label htmlFor="filterFreq">Frequency</label>
            <input
              type="range"
              id="filterFreq"
              min="20"
              max="20000"
              step="1"
              value={parameters.filterFreq}
              onChange={(e) =>
                handleChange("filterFreq", parseFloat(e.target.value))
              }
            />
            <span>{parameters.filterFreq}Hz</span>
          </div>

          <div className={styles.control}>
            <label htmlFor="filterQ">Resonance</label>
            <input
              type="range"
              id="filterQ"
              min="0.1"
              max="10"
              step="0.1"
              value={parameters.filterQ}
              onChange={(e) =>
                handleChange("filterQ", parseFloat(e.target.value))
              }
            />
            <span>{parameters.filterQ.toFixed(1)}</span>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h4>Sequence</h4>
        <div className={styles.controls}>
          <div className={styles.control}>
            <label htmlFor="tempo">Tempo</label>
            <input
              type="range"
              id="tempo"
              min="60"
              max="180"
              step="1"
              value={parameters.tempo}
              onChange={(e) => handleChange("tempo", parseInt(e.target.value))}
            />
            <span>{parameters.tempo} BPM</span>
          </div>

          <div className={styles.control}>
            <label htmlFor="probability">Note Probability</label>
            <input
              type="range"
              id="probability"
              min="0"
              max="1"
              step="0.01"
              value={parameters.probability}
              onChange={(e) =>
                handleChange("probability", parseFloat(e.target.value))
              }
            />
            <span>{Math.round(parameters.probability * 100)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioParameters;
