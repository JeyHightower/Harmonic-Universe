import React from 'react';
import './Logo.css';

const Logo = ({ size = 32 }) => {
  return (
    <div className="logo" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" className="logo-orbit" />
        <circle cx="50" cy="50" r="8" className="logo-center" />
        <circle
          cx="50"
          cy="15"
          r="4"
          className="logo-planet"
          style={{ animation: 'orbit 8s linear infinite' }}
        />
      </svg>
    </div>
  );
};

export default Logo;
