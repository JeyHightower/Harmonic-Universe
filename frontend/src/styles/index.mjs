// Import all styles
import './App.css';
import './DashboardLayout.css'; // Add specific dashboard styles for better click handling
import './Modal.css';
import './theme.css';

// Export any style utility functions if needed
export const applyTheme = (theme) => {
  const root = document.documentElement;
  Object.keys(theme).forEach(variable => {
    root.style.setProperty(`--${variable}`, theme[variable]);
  });
};

// Example theme override function
export const applyCustomAccentColor = (color) => {
  document.documentElement.style.setProperty('--accent-color', color);
};

// Function to fix interaction issues with CSS only
export const fixInteractionStyles = () => {
  document.body.style.pointerEvents = 'auto';

  // Make sure all buttons are clickable
  const allButtons = document.querySelectorAll('button');
  allButtons.forEach(button => {
    button.style.pointerEvents = 'auto';
    button.style.position = 'relative';
    button.style.zIndex = '5';
  });

  // Fix dashboard specific elements
  const dashboardButtons = document.querySelectorAll('.dashboard-actions button');
  dashboardButtons.forEach(button => {
    button.style.pointerEvents = 'auto';
    button.style.zIndex = '25';
  });

  // Fix navigation elements
  const navButtons = document.querySelectorAll('.nav-button');
  navButtons.forEach(button => {
    button.style.pointerEvents = 'auto';
    button.style.cursor = 'pointer';
    button.style.position = 'relative';
    button.style.zIndex = '1002';
  });

  // Fix all anchor tags
  const anchors = document.querySelectorAll('a');
  anchors.forEach(anchor => {
    anchor.style.pointerEvents = 'auto';
    anchor.style.cursor = 'pointer';
    anchor.style.position = 'relative';
    anchor.style.zIndex = '1002';
  });

  // Ensure navigation has proper z-index
  const navigation = document.querySelector('.navigation');
  if (navigation) {
    navigation.style.zIndex = '1000';
    navigation.style.pointerEvents = 'auto';
  }

  return true;
};

// Apply the fixes when the module loads
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    // Apply immediate fixes
    fixInteractionStyles();

    // Also apply after a short delay to catch dynamic elements
    setTimeout(fixInteractionStyles, 500);
  });
}
