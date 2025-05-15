import PropTypes from 'prop-types';
import { forwardRef } from 'react';
import Modal from './Modal';

/**
 * ModalSystem - Compatibility component to work with existing modal components
 * This is a wrapper around the Modal component that provides the same API
 * as the old ModalSystem component.
 */
const ModalSystem = forwardRef(({ children, className, ...props }, ref) => {
  return (
    <Modal {...props} className={className} ref={ref}>
      {children}
    </Modal>
  );
});

ModalSystem.displayName = 'ModalSystem';

ModalSystem.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  title: PropTypes.string,
};

export default ModalSystem;
