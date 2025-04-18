import PropTypes from 'prop-types';
import React, { useId } from 'react';
import { ModalSystem } from './index.mjs';

const FormModal = ({ title, children, onSubmit, onCancel, onClose, formId, ...props }) => {
  // Generate a unique ID for the form if not provided
  const generatedId = useId();
  const uniqueFormId = formId || `form-${generatedId}`;

  return (
    <ModalSystem type="form" title={title} onClose={onClose} {...props}>
      <div className="modal-content">
        <form id={uniqueFormId} onSubmit={onSubmit}>
          {React.Children.map(children, (child) => {
            // Pass the unique form ID to all children that accept it
            if (React.isValidElement(child) && typeof child.type !== 'string') {
              return React.cloneElement(child, { formId: uniqueFormId });
            }
            return child;
          })}
        </form>
      </div>
    </ModalSystem>
  );
};

FormModal.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func,
  onClose: PropTypes.func.isRequired,
  formId: PropTypes.string,
};

export default FormModal;
