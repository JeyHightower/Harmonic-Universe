/**
 * Utility functions to fix interaction issues with UI elements
 * These functions help solve issues where clicks don't register properly
 * or a hard refresh is needed between interactions
 */

/**
 * Recursively sets pointer-events: auto on all elements in a subtree
 * @param {HTMLElement} rootElement - The root element to start fixing from
 */
export const fixPointerEvents = (rootElement = document.body) => {
  if (!rootElement) return;

  // Fix the root element
  rootElement.style.pointerEvents = 'auto';

  // Fix all child elements recursively (only fix problematic ones)
  const allElements = rootElement.querySelectorAll('*');
  let fixedCount = 0;

  allElements.forEach(el => {
    const computedStyle = window.getComputedStyle(el);
    if (computedStyle.pointerEvents === 'none') {
      el.style.pointerEvents = 'auto';
      fixedCount++;
    }
  });

  console.log(`Fixed pointer events for ${fixedCount} elements`);
};

/**
 * Fixes z-index stacking issues that can prevent proper interaction
 */
export const fixZindexIssues = () => {
  // Fix modal z-index issues
  const modalOverlays = document.querySelectorAll('.modal-overlay, .ant-modal-root');
  modalOverlays.forEach((el, index) => {
    el.style.zIndex = `${1050 + (index * 10)}`;
  });

  // Fix content z-index
  const contents = document.querySelectorAll('.modal-content, .ant-modal-content');
  contents.forEach(el => {
    const parent = el.closest('.modal-overlay, .ant-modal-root');
    if (parent) {
      const parentZ = parseInt(window.getComputedStyle(parent).zIndex) || 1050;
      el.style.zIndex = `${parentZ + 2}`;
    } else {
      el.style.zIndex = '1052';
    }
  });
};

/**
 * Removes any lingering modal or overlay styles that might be blocking interaction
 */
export const cleanupBlockingStyles = () => {
  // Remove any modal-open class from body
  document.body.classList.remove('modal-open');

  // Reset any body styles that might block interactions
  document.body.style.position = '';
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
  document.body.style.top = '';
  document.body.style.width = '';

  // Ensure body has pointer events
  document.body.style.pointerEvents = 'auto';

  // Check for any stray backdrops or overlays
  const overlays = document.querySelectorAll('.modal-backdrop, .ant-modal-mask');
  overlays.forEach(overlay => {
    if (overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  });
};

/**
 * Fix issues with dashboard buttons and navigation elements
 * IMPORTANT: Uses CSS properties only, doesn't manipulate DOM structure
 */
export const fixDashboardButtons = () => {
  // Fix dashboard navigation buttons
  const dashboardButtons = document.querySelectorAll('.dashboard-actions button');
  let dashboardFixed = 0;

  dashboardButtons.forEach(button => {
    // Ensure pointer events work
    button.style.pointerEvents = 'auto';
    // Make sure buttons are properly stacked
    button.style.position = 'relative';
    button.style.zIndex = '20';
    dashboardFixed++;
  });

  // Fix universe card interactions
  const universeCards = document.querySelectorAll('.universe-card');
  let cardsFixed = 0;

  universeCards.forEach((card, index) => {
    // Ensure card and its buttons have pointer events
    card.style.pointerEvents = 'auto';

    // Set higher z-index for cards, especially for the first row
    // First row cards get higher z-index than cards below
    const isFirstRow = index < 4; // Assuming typical 4 cards per row
    card.style.position = 'relative';
    card.style.zIndex = isFirstRow ? '15' : '10';

    // Fix all buttons within the card
    const cardButtons = card.querySelectorAll('button');
    cardButtons.forEach(button => {
      button.style.pointerEvents = 'auto';
      // Ensure z-index is appropriate - higher than the card
      button.style.position = 'relative';
      button.style.zIndex = isFirstRow ? '25' : '15';
    });

    cardsFixed++;
  });

  // Ensure the universes grid container has proper z-index and pointer events
  const universesGrid = document.querySelector('.universes-grid');
  if (universesGrid) {
    universesGrid.style.pointerEvents = 'auto';
    universesGrid.style.position = 'relative';
    universesGrid.style.zIndex = '5';
  }

  console.log(`Fixed ${dashboardFixed} dashboard buttons and ${cardsFixed} universe cards`);
};

/**
 * Apply all fixes at once - using only CSS modifications and safe methods
 */
export const applyAllInteractionFixes = () => {
  console.log('Applying safe interaction fixes...');

  // Cleanup blocking styles first
  cleanupBlockingStyles();

  // Fix pointer events
  fixPointerEvents();

  // Fix z-index issues
  fixZindexIssues();

  // Fix dashboard specific issues
  fixDashboardButtons();

  // Force global event handling to be enabled
  document.body.style.pointerEvents = 'auto';

  console.log('Safe interaction fixes applied');

  return true;
};

/**
 * Detect if we're experiencing interaction issues
 * Returns true if problems are detected
 */
export const detectInteractionIssues = () => {
  let issuesDetected = false;

  // Check for pointer-events: none
  const elements = document.querySelectorAll('*');
  let pointerEventsNoneCount = 0;

  elements.forEach(el => {
    const style = window.getComputedStyle(el);
    if (style.pointerEvents === 'none' &&
        !el.classList.contains('disabled') &&
        el.tagName !== 'SCRIPT' &&
        el.tagName !== 'STYLE') {
      pointerEventsNoneCount++;
    }
  });

  if (pointerEventsNoneCount > 20) { // Threshold for detecting an issue
    issuesDetected = true;
    console.warn(`Found ${pointerEventsNoneCount} elements with pointer-events: none`);
  }

  return issuesDetected;
};

/**
 * Add this auto-fix to be triggered when interaction issues are detected
 * Can be called on component mount or from a debug button
 */
export const setupAutoFix = () => {
  // Check for issues every 5 seconds - less frequently to avoid interference
  const intervalId = setInterval(() => {
    if (detectInteractionIssues()) {
      console.log('Interaction issues detected, applying fixes automatically');
      applyAllInteractionFixes();
    }
  }, 5000);

  // Return cleanup function
  return () => clearInterval(intervalId);
};

/**
 * Apply essential fixes only - safe version that won't break React
 */
export const applyEssentialFixes = () => {
  console.log('Applying essential interaction fixes...');

  // Clean up any blocking styles
  cleanupBlockingStyles();

  // Fix pointer events
  fixPointerEvents();

  // Enable interactive elements
  document.querySelectorAll('button, a, input, select, textarea, [role="button"]')
    .forEach(el => {
      el.style.pointerEvents = 'auto';
    });

  // Fix dashboard specific issues with CSS only
  fixDashboardButtons();

  console.log('Essential interaction fixes applied');
  return true;
};

// Export all functions
export default {
  fixPointerEvents,
  fixZindexIssues,
  cleanupBlockingStyles,
  fixDashboardButtons,
  applyAllInteractionFixes,
  detectInteractionIssues,
  setupAutoFix,
  applyEssentialFixes
};
