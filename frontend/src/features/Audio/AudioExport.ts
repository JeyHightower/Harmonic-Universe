import PropTypes from 'prop-types';
import React, { useState } from 'react';
import styles from './Audio.module.css';

const AudioExport = ({ onExport, disabled }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState('wav');
  const [duration, setDuration] = useState(30);

  const handleExport = async () => {
    if (disabled || isExporting) return;

    setIsExporting(true);
    try {
      await onExport({
        format: exportFormat,
        duration: duration,
      });
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={styles.audioExport}>
      <h3 className={styles.sectionTitle}>Export Audio</h3>
      <div className={styles.exportControls}>
        <div className={styles.exportControl}>
          <label htmlFor="format">Format:</label>
          <select
            id="format"
            value={exportFormat}
            onChange={e => setExportFormat(e.target.value)}
            disabled={disabled || isExporting}
            className={styles.exportSelect}
          >
            <option value="wav">WAV</option>
            <option value="mp3">MP3</option>
          </select>
        </div>
        <div className={styles.exportControl}>
          <label htmlFor="duration">Duration (seconds):</label>
          <input
            id="duration"
            type="number"
            min="1"
            max="300"
            value={duration}
            onChange={e =>
              setDuration(Math.max(1, Math.min(300, parseInt(e.target.value))))
            }
            disabled={disabled || isExporting}
            className={styles.exportInput}
          />
        </div>
        <button
          onClick={handleExport}
          disabled={disabled || isExporting}
          className={styles.exportButton}
        >
          {isExporting ? 'Exporting...' : 'Export'}
        </button>
      </div>
      <p className={styles.exportNote}>
        Note: Export duration is limited to 5 minutes. The exported file will
        contain the current harmony loop with the selected parameters.
      </p>
    </div>
  );
};

AudioExport.propTypes = {
  onExport: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default AudioExport;
