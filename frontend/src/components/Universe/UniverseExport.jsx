import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  exportUniverse,
  importUniverse,
  resetExportStatus,
  resetImportStatus,
} from '../../store/slices/universeSlice';
import commonStyles from '../../styles/common.module.css';
import styles from './Universe.module.css';

const UniverseExport = ({ universeId }) => {
  const dispatch = useDispatch();
  const { exportStatus, importStatus, error } = useSelector(
    state => state.universe
  );

  useEffect(() => {
    return () => {
      dispatch(resetExportStatus());
      dispatch(resetImportStatus());
    };
  }, [dispatch]);

  const handleExport = async () => {
    try {
      await dispatch(exportUniverse(universeId)).unwrap();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleImport = async event => {
    const file = event.target.files[0];
    if (file) {
      try {
        await dispatch(importUniverse(file)).unwrap();
        event.target.value = ''; // Reset file input
      } catch (error) {
        console.error('Import failed:', error);
      }
    }
  };

  return (
    <div className={styles.exportContainer}>
      <h3>Export/Import Universe</h3>

      <div className={styles.exportActions}>
        <div className={styles.exportSection}>
          <h4>Export Universe</h4>
          <button
            onClick={handleExport}
            className={commonStyles.primaryButton}
            disabled={exportStatus === 'loading'}
          >
            {exportStatus === 'loading' ? 'Exporting...' : 'Export Universe'}
          </button>
          {exportStatus === 'success' && (
            <p className={styles.successMessage}>
              Universe exported successfully!
            </p>
          )}
        </div>

        <div className={styles.exportSection}>
          <h4>Import Universe</h4>
          <input
            type="file"
            accept=".zip"
            onChange={handleImport}
            className={styles.fileInput}
            disabled={importStatus === 'loading'}
          />
          {importStatus === 'success' && (
            <p className={styles.successMessage}>
              Universe imported successfully!
            </p>
          )}
        </div>
      </div>

      {error && <p className={commonStyles.error}>{error}</p>}

      <div className={styles.exportInfo}>
        <h4>Export Format</h4>
        <p>The exported file will contain:</p>
        <ul>
          <li>Universe parameters (JSON)</li>
          <li>Harmony audio file (WAV)</li>
        </ul>
      </div>
    </div>
  );
};

export default UniverseExport;
