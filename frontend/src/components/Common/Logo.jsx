import { SvgIcon } from '@mui/material';
import React from 'react';

const Logo = ({ width = 40, height = 40, color = 'primary' }) => (
  <SvgIcon
    viewBox="0 0 100 100"
    sx={{
      width,
      height,
      '& path': {
        fill: `${color}.main`,
      },
    }}
  >
    {/* Orbital circles */}
    <circle
      cx="50"
      cy="50"
      r="45"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      opacity="0.3"
    />
    <circle
      cx="50"
      cy="50"
      r="35"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      opacity="0.5"
    />
    <circle
      cx="50"
      cy="50"
      r="25"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      opacity="0.7"
    />

    {/* Sound wave pattern */}
    <path
      d="M20,50 Q35,20 50,50 T80,50"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
    />

    {/* Central core */}
    <circle
      cx="50"
      cy="50"
      r="8"
      fill="currentColor"
    />

    {/* Orbital particles */}
    <circle cx="85" cy="50" r="4" fill="currentColor" opacity="0.8" />
    <circle cx="15" cy="50" r="4" fill="currentColor" opacity="0.8" />
    <circle cx="50" cy="85" r="4" fill="currentColor" opacity="0.8" />
    <circle cx="50" cy="15" r="4" fill="currentColor" opacity="0.8" />
  </SvgIcon>
);

export default Logo;
