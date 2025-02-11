import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  createTemplate,
  fetchCategories,
  updateTemplate,
} from '../../redux/slices/templateSlice';
import styles from './Templates.module.css';

const TemplateForm = ({ template, onSubmit, onCancel }) => {
  const dispatch = useDispatch();
  const { categories, isLoading } = useSelector(state => state.templates);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    physics_params: {},
    music_params: {},
    is_public: true,
  });

  useEffect(() => {
    dispatch(fetchCategories());
    if (template) {
      setFormData({
        name: template.name,
        description: template.description,
        category: template.category,
        physics_params: template.physics_params,
        music_params: template.music_params,
        is_public: template.is_public,
      });
    }
  }, [dispatch, template]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const action = template
        ? updateTemplate({ templateId: template.id, templateData: formData })
        : createTemplate(formData);
      const result = await dispatch(action).unwrap();
      if (onSubmit) {
        onSubmit(result);
      }
    } catch (error) {
      console.error('Failed to save template:', error);
    }
  };

  return (
    <form className={styles.templateForm} onSubmit={handleSubmit}>
      <div className={styles.formGroup}>
        <label htmlFor="name">Template Name</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="Enter template name"
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe your template"
          rows={4}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="category">Category</label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
        >
          <option value="">Select a category</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            name="is_public"
            checked={formData.is_public}
            onChange={handleChange}
          />
          Make this template public
        </label>
      </div>

      <div className={styles.formActions}>
        <button
          type="button"
          onClick={onCancel}
          className={styles.cancelButton}
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className={styles.submitButton}
          disabled={isLoading}
        >
          {isLoading
            ? 'Saving...'
            : template
            ? 'Update Template'
            : 'Create Template'}
        </button>
      </div>
    </form>
  );
};

TemplateForm.propTypes = {
  template: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    category: PropTypes.string.isRequired,
    physics_params: PropTypes.object.isRequired,
    music_params: PropTypes.object.isRequired,
    is_public: PropTypes.bool.isRequired,
  }),
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func,
};

export default TemplateForm;
