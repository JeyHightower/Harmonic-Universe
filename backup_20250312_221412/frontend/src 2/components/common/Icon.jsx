import PropTypes from 'prop-types';
import AddIconSvg from '../../assets/icons/add.svg';
import BasicIconSvg from '../../assets/icons/basic.svg';
import BoxIconSvg from '../../assets/icons/box.svg';
import CapsuleIconSvg from '../../assets/icons/capsule.svg';
import CheckIconSvg from '../../assets/icons/check.svg';
import ConeIconSvg from '../../assets/icons/cone.svg';
import CylinderIconSvg from '../../assets/icons/cylinder.svg';
import DeleteIconSvg from '../../assets/icons/delete.svg';
import EditIconSvg from '../../assets/icons/edit.svg';
import EmptyIconSvg from '../../assets/icons/empty.svg';
import ErrorIconSvg from '../../assets/icons/error.svg';
import MaterialIconSvg from '../../assets/icons/material.svg';
import PhysicsIconSvg from '../../assets/icons/physics.svg';
import PlaneIconSvg from '../../assets/icons/plane.svg';
import PositionIconSvg from '../../assets/icons/position.svg';
import RefreshIconSvg from '../../assets/icons/refresh.svg';
import SphereIconSvg from '../../assets/icons/sphere.svg';
import ViewIconSvg from '../../assets/icons/view.svg';
import WarningIconSvg from '../../assets/icons/warning.svg';
import './Icon.css';

/**
 * Icon component for displaying SVG icons
 * @param {Object} props
 * @param {string} props.name - Icon name
 * @param {('small'|'medium'|'large')} [props.size='medium'] - Icon size
 * @param {string} [props.className=''] - Additional class name
 */
function Icon({ name, size = 'medium', className = '' }) {
  const iconClass = `
    icon
    icon-${size}
    ${className}
  `
    .trim()
    .replace(/\s+/g, ' ');

  const getIcon = () => {
    switch (name) {
      case 'edit':
        return <img src={EditIconSvg} className={iconClass} alt="Edit" />;
      case 'delete':
        return <img src={DeleteIconSvg} className={iconClass} alt="Delete" />;
      case 'physics':
        return <img src={PhysicsIconSvg} className={iconClass} alt="Physics" />;
      case 'add':
        return <img src={AddIconSvg} className={iconClass} alt="Add" />;
      case 'error':
        return <img src={ErrorIconSvg} className={iconClass} alt="Error" />;
      case 'refresh':
        return <img src={RefreshIconSvg} className={iconClass} alt="Refresh" />;
      case 'view':
        return <img src={ViewIconSvg} className={iconClass} alt="View" />;
      case 'empty':
        return <img src={EmptyIconSvg} className={iconClass} alt="Empty" />;
      case 'check':
        return <img src={CheckIconSvg} className={iconClass} alt="Check" />;
      case 'warning':
        return <img src={WarningIconSvg} className={iconClass} alt="Warning" />;
      case 'basic':
        return <img src={BasicIconSvg} className={iconClass} alt="Basic" />;
      case 'position':
        return (
          <img src={PositionIconSvg} className={iconClass} alt="Position" />
        );
      case 'material':
        return (
          <img src={MaterialIconSvg} className={iconClass} alt="Material" />
        );
      case 'box':
        return <img src={BoxIconSvg} className={iconClass} alt="Box" />;
      case 'sphere':
        return <img src={SphereIconSvg} className={iconClass} alt="Sphere" />;
      case 'capsule':
        return <img src={CapsuleIconSvg} className={iconClass} alt="Capsule" />;
      case 'cylinder':
        return (
          <img src={CylinderIconSvg} className={iconClass} alt="Cylinder" />
        );
      case 'cone':
        return <img src={ConeIconSvg} className={iconClass} alt="Cone" />;
      case 'plane':
        return <img src={PlaneIconSvg} className={iconClass} alt="Plane" />;
      default:
        console.warn(`Icon "${name}" not found, using fallback`);
        return (
          <div
            className={`${iconClass} icon-fallback`}
            title={`Unknown icon: ${name}`}
          ></div>
        );
    }
  };

  return getIcon();
}

Icon.propTypes = {
  name: PropTypes.string.isRequired,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  className: PropTypes.string,
};

export default Icon;
