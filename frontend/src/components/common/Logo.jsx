import { useTheme } from '../../contexts/ThemeContext';
import './Logo.css';

const Logo = ({ size = 40 }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="logo-svg"
    >
      {/* Outer orbit */}
      <circle
        cx="20"
        cy="20"
        r="18"
        stroke={`url(#orbit-gradient-${theme})`}
        strokeWidth="0.5"
        strokeDasharray="2 2"
      />

      {/* Inner orbits with wave pattern */}
      <path
        d="M10,20 Q20,15 30,20 Q20,25 10,20"
        stroke={`url(#wave-gradient-${theme})`}
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M8,20 Q20,12 32,20 Q20,28 8,20"
        stroke={`url(#wave-gradient-${theme})`}
        strokeWidth="1"
        fill="none"
        opacity="0.6"
      />

      {/* Central sphere */}
      <circle cx="20" cy="20" r="6" fill={`url(#sphere-gradient-${theme})`} />

      {/* Particles */}
      <circle cx="14" cy="20" r="1.5" fill={isDark ? '#818cf8' : '#6366f1'} />
      <circle cx="26" cy="20" r="1.5" fill={isDark ? '#818cf8' : '#6366f1'} />
      <circle cx="20" cy="14" r="1.5" fill={isDark ? '#a78bfa' : '#8b5cf6'} />
      <circle cx="20" cy="26" r="1.5" fill={isDark ? '#a78bfa' : '#8b5cf6'} />

      {/* Gradients */}
      <defs>
        <linearGradient
          id={`orbit-gradient-${theme}`}
          x1="0"
          y1="20"
          x2="40"
          y2="20"
        >
          <stop offset="0%" stopColor={isDark ? '#818cf8' : '#6366f1'} />
          <stop offset="100%" stopColor={isDark ? '#a78bfa' : '#8b5cf6'} />
        </linearGradient>

        <linearGradient
          id={`wave-gradient-${theme}`}
          x1="0"
          y1="20"
          x2="40"
          y2="20"
        >
          <stop offset="0%" stopColor={isDark ? '#818cf8' : '#6366f1'} />
          <stop offset="50%" stopColor={isDark ? '#a78bfa' : '#8b5cf6'} />
          <stop offset="100%" stopColor={isDark ? '#818cf8' : '#6366f1'} />
        </linearGradient>

        <radialGradient
          id={`sphere-gradient-${theme}`}
          cx="0.5"
          cy="0.5"
          r="0.5"
        >
          <stop offset="0%" stopColor={isDark ? '#c4b5fd' : '#a78bfa'} />
          <stop offset="100%" stopColor={isDark ? '#818cf8' : '#6366f1'} />
        </radialGradient>
      </defs>
    </svg>
  );
};

export default Logo;
