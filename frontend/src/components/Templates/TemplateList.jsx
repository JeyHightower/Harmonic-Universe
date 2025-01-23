import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  createUniverseFromTemplate,
  fetchCategories,
  fetchTemplates,
} from '../../store/slices/templateSlice';
import LoadingSpinner from '../common/LoadingSpinner';
import styles from './Templates.module.css';

const TemplateList = ({ onTemplateSelect }) => {
  const dispatch = useDispatch();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { templates, categories, isLoading, error } = useSelector(
    state => state.templates
  );

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchTemplates());
  }, [dispatch]);

  const handleCategoryChange = category => {
    setSelectedCategory(category);
    dispatch(fetchTemplates(category === 'all' ? null : category));
  };

  const handleTemplateSelect = template => {
    if (onTemplateSelect) {
      onTemplateSelect(template);
    }
  };

  const handleCreateFromTemplate = async (template, event) => {
    event.stopPropagation();
    try {
      await dispatch(
        createUniverseFromTemplate({
          templateId: template.id,
          universeData: { name: `${template.name} Universe` },
        })
      ).unwrap();
      // Handle success (e.g., show notification, redirect)
    } catch (error) {
      // Handle error
      console.error('Failed to create universe from template:', error);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.templateList}>
      <div className={styles.categoryFilter}>
        <button
          className={`${styles.categoryButton} ${
            selectedCategory === 'all' ? styles.active : ''
          }`}
          onClick={() => handleCategoryChange('all')}
        >
          All
        </button>
        {categories.map(category => (
          <button
            key={category}
            className={`${styles.categoryButton} ${
              selectedCategory === category ? styles.active : ''
            }`}
            onClick={() => handleCategoryChange(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className={styles.templatesGrid}>
        {templates.map(template => (
          <div
            key={template.id}
            className={styles.templateCard}
            onClick={() => handleTemplateSelect(template)}
          >
            <h3 className={styles.templateName}>{template.name}</h3>
            <p className={styles.templateDescription}>{template.description}</p>
            <div className={styles.templateMeta}>
              <span className={styles.templateCategory}>
                {template.category}
              </span>
              <span className={styles.templateCreator}>
                by {template.creator.username}
              </span>
            </div>
            <button
              className={styles.useTemplateButton}
              onClick={e => handleCreateFromTemplate(template, e)}
            >
              Use Template
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

TemplateList.propTypes = {
  onTemplateSelect: PropTypes.func,
};

export default TemplateList;
