import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import Modal from '../common/Modal';
import TemplateDetail from './TemplateDetail';
import TemplateForm from './TemplateForm';
import TemplateList from './TemplateList';
import styles from './Templates.module.css';

const TemplatesPage = () => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const { isLoading } = useSelector(state => state.templates);

  const handleTemplateSelect = template => {
    setSelectedTemplate(template);
  };

  const handleCreateClick = () => {
    setIsCreating(true);
  };

  const handleCloseModal = () => {
    setSelectedTemplate(null);
    setIsCreating(false);
  };

  const handleCreateSuccess = () => {
    setIsCreating(false);
  };

  return (
    <div className={styles.templatesPage}>
      <div className={styles.templatesHeader}>
        <h1>Universe Templates</h1>
        <button
          onClick={handleCreateClick}
          className={styles.createButton}
          disabled={isLoading}
        >
          Create Template
        </button>
      </div>

      <TemplateList onTemplateSelect={handleTemplateSelect} />

      {selectedTemplate && (
        <Modal onClose={handleCloseModal}>
          <TemplateDetail
            templateId={selectedTemplate.id}
            onClose={handleCloseModal}
          />
        </Modal>
      )}

      {isCreating && (
        <Modal onClose={handleCloseModal}>
          <TemplateForm
            onSubmit={handleCreateSuccess}
            onCancel={handleCloseModal}
          />
        </Modal>
      )}
    </div>
  );
};

export default TemplatesPage;
