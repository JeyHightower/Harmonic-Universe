import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { exportToJSON, exportToMarkdown } from '../../utils/exportUtils';
import styles from './BatchOperations.module.css';

const BatchOperations = ({
  storyboards,
  universeId,
  onBatchDelete,
  onBatchHarmonyUpdate,
}) => {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [harmonyValue, setHarmonyValue] = useState(0.5);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const toggleSelection = id => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleAll = () => {
    if (selectedIds.size === storyboards.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(storyboards.map(s => s.id)));
    }
  };

  const handleExport = format => {
    const selectedStoryboards = storyboards.filter(s => selectedIds.has(s.id));
    if (format === 'json') {
      exportToJSON(selectedStoryboards, universeId);
    } else {
      exportToMarkdown(selectedStoryboards, universeId);
    }
  };

  const handleBatchDelete = () => {
    if (isConfirmingDelete) {
      onBatchDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
      setIsConfirmingDelete(false);
    } else {
      setIsConfirmingDelete(true);
    }
  };

  const handleBatchHarmonyUpdate = () => {
    onBatchHarmonyUpdate(Array.from(selectedIds), harmonyValue);
    setSelectedIds(new Set());
  };

  return (
    <div className={styles.batchOperations}>
      <div className={styles.header}>
        <h4>Batch Operations</h4>
        <div className={styles.selectionControls}>
          <button className={styles.selectAllButton} onClick={toggleAll}>
            {selectedIds.size === storyboards.length
              ? 'Deselect All'
              : 'Select All'}
          </button>
          <span className={styles.selectedCount}>
            {selectedIds.size} selected
          </span>
        </div>
      </div>

      <div className={styles.storyboardList}>
        {storyboards.map(storyboard => (
          <div
            key={storyboard.id}
            className={`${styles.storyboardItem} ${
              selectedIds.has(storyboard.id) ? styles.selected : ''
            }`}
            onClick={() => toggleSelection(storyboard.id)}
          >
            <input
              type="checkbox"
              checked={selectedIds.has(storyboard.id)}
              onChange={() => toggleSelection(storyboard.id)}
            />
            <span className={styles.plotPoint}>{storyboard.plot_point}</span>
          </div>
        ))}
      </div>

      {selectedIds.size > 0 && (
        <div className={styles.operations}>
          <div className={styles.harmonyUpdate}>
            <label>Set Harmony Value:</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={harmonyValue}
              onChange={e => setHarmonyValue(parseFloat(e.target.value))}
            />
            <span>{harmonyValue.toFixed(2)}</span>
            <button
              onClick={handleBatchHarmonyUpdate}
              className={styles.updateButton}
            >
              Update
            </button>
          </div>

          <div className={styles.exportOptions}>
            <button
              onClick={() => handleExport('json')}
              className={styles.exportButton}
            >
              Export JSON
            </button>
            <button
              onClick={() => handleExport('markdown')}
              className={styles.exportButton}
            >
              Export Markdown
            </button>
          </div>

          <button
            onClick={handleBatchDelete}
            className={`${styles.deleteButton} ${
              isConfirmingDelete ? styles.confirming : ''
            }`}
          >
            {isConfirmingDelete
              ? 'Click again to confirm deletion'
              : 'Delete Selected'}
          </button>
        </div>
      )}
    </div>
  );
};

BatchOperations.propTypes = {
  storyboards: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      plot_point: PropTypes.string.isRequired,
      harmony_tie: PropTypes.number.isRequired,
    })
  ).isRequired,
  universeId: PropTypes.string.isRequired,
  onBatchDelete: PropTypes.func.isRequired,
  onBatchHarmonyUpdate: PropTypes.func.isRequired,
};

export default BatchOperations;
