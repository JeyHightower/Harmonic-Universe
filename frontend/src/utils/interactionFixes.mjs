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
 * Repairs event propagation issues by ensuring events don't bubble unexpectedly
 */
export const fixEventPropagation = () => {
  // Fix click handling on modal content
  const modalContents = document.querySelectorAll('.modal-content, .ant-modal-content');
  modalContents.forEach(content => {
    // Replace with a clone to remove existing event listeners that might be problematic
    const clone = content.cloneNode(true);

    // Add a new clean click handler that stops propagation
    clone.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Replace the element
    if (content.parentNode) {
      content.parentNode.replaceChild(clone, content);
    }
  });
};

/**
 * Creates shadow DOM isolation for modal elements to prevent them
 * from being affected by external styles and event handlers
 */
export const isolateModals = () => {
  const portalRoot = document.getElementById('portal-root');
  if (!portalRoot) return;

  // Create a new shadow root for isolation if it doesn't exist
  if (!portalRoot.shadowRoot) {
    const shadow = portalRoot.attachShadow({ mode: 'open' });

    // Move all portal children into shadow DOM
    while (portalRoot.firstChild) {
      shadow.appendChild(portalRoot.firstChild);
    }

    console.log('Created shadow DOM isolation for modals');
  }
};

/**
 * Apply all fixes at once - the nuclear option for severe issues
 */
export const applyAllInteractionFixes = () => {
  console.log('Applying comprehensive interaction fixes...');

  // Fix pointer events
  fixPointerEvents();

  // Fix z-index issues
  fixZindexIssues();

  // Fix event propagation
  fixEventPropagation();

  // Force global event handling to be enabled
  document.body.style.pointerEvents = 'auto';

  console.log('All interaction fixes applied');

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
  // Check for issues every 3 seconds
  const intervalId = setInterval(() => {
    if (detectInteractionIssues()) {
      console.log('Interaction issues detected, applying fixes automatically');
      applyAllInteractionFixes();
    }
  }, 3000);

  // Return cleanup function
  return () => clearInterval(intervalId);
};

/**
 * Apply essential fixes only
 */
export const applyEssentialFixes = () => {
  console.log('Applying essential interaction fixes...');

  // Fix pointer events
  fixPointerEvents();

  // Enable interactive elements
  document.querySelectorAll('button, a, input, select, textarea, [role="button"]')
    .forEach(el => {
      el.style.pointerEvents = 'auto';
    });

  console.log('Essential interaction fixes applied');
  return true;
};

// Export all functions
export default {
  fixPointerEvents,
  fixZindexIssues,
  fixEventPropagation,
  isolateModals,
  applyAllInteractionFixes,
  detectInteractionIssues,
  setupAutoFix,
  applyEssentialFixes
};
