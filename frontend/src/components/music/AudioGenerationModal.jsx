import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Modal from "../../components/common/Modal";
import Select from "../../components/common/Select";
import Slider from "../../components/common/Slider";
import Spinner from "../../components/common/Spinner";
import "../../styles/Modal.css";
import * as Tone from "tone";
import { AudioGenerationModalFinal } from "../consolidated";

/**
 * @deprecated - Use AudioGenerationModalFinal from consolidated directory instead
 */
const AudioGenerationModal = (props) => {
  return <AudioGenerationModalFinal {...props} />;
};

AudioGenerationModal.propTypes = {
  universeId: PropTypes.string.isRequired,
  sceneId: PropTypes.string.isRequired,
  initialData: PropTypes.object,
  onClose: PropTypes.func,
  modalProps: PropTypes.object,
  isGlobalModal: PropTypes.bool,
};

AudioGenerationModal.defaultProps = {
  initialData: null,
  onClose: () => {},
  modalProps: {},
  isGlobalModal: false,
};

export default AudioGenerationModal;
