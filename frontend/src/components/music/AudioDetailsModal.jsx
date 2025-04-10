import PropTypes from "prop-types";
import React from "react";
import { AudioDetailsModalFinal } from "../consolidated";

/**
 * @deprecated - Use AudioDetailsModalFinal from consolidated directory instead
 */
const AudioDetailsModal = (props) => {
  return <AudioDetailsModalFinal {...props} />;
};

AudioDetailsModal.propTypes = {
  universeId: PropTypes.string.isRequired,
  sceneId: PropTypes.string,
  audioId: PropTypes.string.isRequired,
  onClose: PropTypes.func,
  modalProps: PropTypes.object,
  isGlobalModal: PropTypes.bool,
};

AudioDetailsModal.defaultProps = {
  sceneId: null,
  onClose: () => {},
  modalProps: {},
  isGlobalModal: false,
};

export default AudioDetailsModal;
