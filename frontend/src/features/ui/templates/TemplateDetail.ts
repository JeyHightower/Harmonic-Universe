import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  deleteTemplate,
  fetchTemplate,
} from '../../redux/slices/templateSlice';
import LoadingSpinner from '../common/LoadingSpinner';
import TemplateForm from './TemplateForm';
import styles from './Templates.module.css';

const TemplateDetail = ({ templateId, onClose }) => {
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const { currentTemplate, isLoading, error } = useSelector(
    state => state.templates
  );
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    dispatch(fetchTemplate(templateId));
  }, [dispatch, templateId]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await dispatch(deleteTemplate(templateId)).unwrap();
        if (onClose) {
          onClose();
        }
      } catch (error) {
        console.error('Failed to delete template:', error);
      }
    }
  };

  const handleSubmit = () => {
    setIsEditing(false);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!currentTemplate) {
    return <div className={styles.error}>Template not found</div>;
  }

  if (isEditing) {
    return (
      <TemplateForm
        template={currentTemplate}
        onSubmit={handleSubmit}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  const isOwner = currentTemplate.creator_id === user?.id;

  return (
    <div className={styles.templateDetail}>
      <div className={styles.templateHeader}>
        <h2 className={styles.templateTitle}>{currentTemplate.name}</h2>
        {isOwner && (
          <div className={styles.templateActions}>
            <button onClick={handleEdit} className={styles.editButton}>
              Edit
            </button>
            <button onClick={handleDelete} className={styles.deleteButton}>
              Delete
            </button>
          </div>
        )}
      </div>

      <div className={styles.templateInfo}>
        <div className={styles.templateMetadata}>
          <span className={styles.templateCategory}>
            {currentTemplate.category}
          </span>
          <span className={styles.templateCreator}>
            by {currentTemplate.creator.username}
          </span>
          <span className={styles.templateVisibility}>
            {currentTemplate.is_public ? 'Public' : 'Private'}
          </span>
        </div>

        <p className={styles.templateDescription}>
          {currentTemplate.description}
        </p>

        <div className={styles.parameterSection}>
          <h3>Physics Parameters</h3>
          <pre className={styles.parameterCode}>
            {JSON.stringify(currentTemplate.physics_params, null, 2)}
          </pre>
        </div>

        <div className={styles.parameterSection}>
          <h3>Music Parameters</h3>
          <pre className={styles.parameterCode}>
            {JSON.stringify(currentTemplate.music_params, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

TemplateDetail.propTypes = {
  templateId: PropTypes.number.isRequired,
  onClose: PropTypes.func,
};

export default TemplateDetail;
