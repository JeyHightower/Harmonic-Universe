import PropTypes from 'prop-types';
import './Logo.css';

function Logo({ size = 32 }) {
  return (
    <div className="logo" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" className="logo-circle" />
        <path
          d="M30 50 L70 50 M50 30 L50 70"
          className="logo-cross"
          strokeWidth="8"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

Logo.propTypes = {
  size: PropTypes.number,
};

export default Logo;
