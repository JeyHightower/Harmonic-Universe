import React from "react";
import PropTypes from "prop-types";
import addIcon from "../../assets/add.svg";
import basicIcon from "../../assets/basic.svg";
import boxIcon from "../../assets/box.svg";
import capsuleIcon from "../../assets/capsule.svg";
import checkIcon from "../../assets/check.svg";
import coneIcon from "../../assets/cone.svg";
import cylinderIcon from "../../assets/cylinder.svg";
import deleteIcon from "../../assets/delete.svg";
import editIcon from "../../assets/edit.svg";
import emptyIcon from "../../assets/empty.svg";
import errorIcon from "../../assets/error.svg";
import infoIcon from "../../assets/info.svg";
import materialIcon from "../../assets/material.svg";
import physicsIcon from "../../assets/physics.svg";
import planeIcon from "../../assets/plane.svg";
import plusIcon from "../../assets/plus.svg";
import positionIcon from "../../assets/position.svg";
import refreshIcon from "../../assets/refresh.svg";
import sceneIcon from "../../assets/scene.svg";
import sphereIcon from "../../assets/sphere.svg";
import viewIcon from "../../assets/view.svg";
import warningIcon from "../../assets/warning.svg";
import "../../styles/Icon.css";

/**
 * Icon component for displaying SVG icons
 * @param {Object} props
 * @param {string} props.name - Icon name
 * @param {string} [props.className=''] - Additional class name
 */
const Icon = ({ name, className = "", ...props }) => {
  const icons = {
    add: addIcon,
    basic: basicIcon,
    box: boxIcon,
    capsule: capsuleIcon,
    check: checkIcon,
    cone: coneIcon,
    cylinder: cylinderIcon,
    delete: deleteIcon,
    edit: editIcon,
    empty: emptyIcon,
    error: errorIcon,
    info: infoIcon,
    material: materialIcon,
    physics: physicsIcon,
    plane: planeIcon,
    plus: plusIcon,
    position: positionIcon,
    refresh: refreshIcon,
    scene: sceneIcon,
    sphere: sphereIcon,
    view: viewIcon,
    warning: warningIcon,
  };

  const icon = icons[name];
  if (!icon) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  return (
    <img
      src={icon}
      alt={`${name} icon`}
      className={`icon ${className}`}
      {...props}
    />
  );
};

Icon.propTypes = {
  name: PropTypes.string.isRequired,
  className: PropTypes.string,
};

export default Icon;
