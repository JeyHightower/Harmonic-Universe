/**
 * Modal debugging utilities
 * These tools can help diagnose modal issues in development
 */

/**
 * Add this function to window for easy console access
 */
export const setupModalDebugging = () => {
  if (typeof window !== 'undefined') {
    window.__modalDebug = {
      checkPointerEvents,
      checkZIndexes,
      checkEventListeners,
      fixModalIssues,
      showModalOverlay,
      applyAggressiveFix,
      monitorClicks
    };
    console.log('Modal debugging tools available at window.__modalDebug');
  }
};

/**
 * Check if any modal elements have pointer-events: none
 */
export const checkPointerEvents = () => {
  const modalElements = document.querySelectorAll('.modal-content, .ant-modal-content, .modal-body, .ant-modal-body');
  const results = [];

  modalElements.forEach(el => {
    const computed = window.getComputedStyle(el);
    if (computed.pointerEvents === 'none') {
      results.push({
        element: el,
        className: el.className,
        pointerEvents: computed.pointerEvents
      });
    }
  });

  console.log(`Found ${results.length} elements with pointer-events: none`);
  console.table(results);

  return results;
};

/**
 * Check for z-index stacking issues
 */
export const checkZIndexes = () => {
  const modalElements = document.querySelectorAll('.modal-content, .ant-modal, .modal-overlay, .ant-modal-root, #portal-root');
  const results = [];

  modalElements.forEach(el => {
    const computed = window.getComputedStyle(el);
    results.push({
      element: el,
      className: el.className,
      zIndex: computed.zIndex,
      position: computed.position
    });
  });

  console.log('Z-index stacking context:');
  console.table(results);

  return results;
};

/**
 * Check for event listener issues
 * This will identify any click handlers on modal elements
 */
export const checkEventListeners = () => {
  console.log('Inspect each element to see the attached event listeners.');
  console.log('In Chrome DevTools, look for the "Event Listeners" tab when an element is selected.');

  const modalContainer = document.querySelector('.modal-container');
  const modalContent = document.querySelector('.modal-content');
  const modalBackdrop = document.querySelector('.modal-backdrop');
  const antModal = document.querySelector('.ant-modal');

  console.log({
    modalContainer,
    modalContent,
    modalBackdrop,
    antModal
  });

  return {
    modalContainer,
    modalContent,
    modalBackdrop,
    antModal
  };
};

/**
 * Quick fix for common modal issues
 */
export const fixModalIssues = () => {
  // Fix pointer-events
  const modalElements = document.querySelectorAll('.modal-content, .modal-body, .ant-modal-content, .ant-modal-body, .modal-inner-content, .modal-content-wrapper');
  modalElements.forEach(el => {
    el.style.pointerEvents = 'auto';
  });

  // Fix z-index issues
  const overlays = document.querySelectorAll('.modal-overlay, .ant-modal-root');
  overlays.forEach(el => {
    el.style.zIndex = '1050';
  });

  const contents = document.querySelectorAll('.modal-content, .ant-modal-content');
  contents.forEach(el => {
    el.style.zIndex = '1051';
  });

  // Fix click propagation
  const containers = document.querySelectorAll('.modal-container');
  containers.forEach(container => {
    const content = container.querySelector('.modal-content, .ant-modal-content');
    if (content) {
      const originalClickHandler = content.onclick;
      content.onclick = (e) => {
        e.stopPropagation();
        if (originalClickHandler) {
          originalClickHandler(e);
        }
      };
    }
  });

  // Ensure landing page elements are not affected
  const homeContainer = document.querySelector('.home-container');
  if (homeContainer) {
    homeContainer.style.pointerEvents = 'auto';
    homeContainer.style.zIndex = '1';

    const homeContent = homeContainer.querySelector('.home-content');
    if (homeContent) {
      homeContent.style.pointerEvents = 'auto';
      homeContent.style.zIndex = '2';
    }

    const homeActions = homeContainer.querySelector('.home-actions');
    if (homeActions) {
      homeActions.style.pointerEvents = 'auto';
      homeActions.style.zIndex = '3';
    }

    const buttons = homeContainer.querySelectorAll('button, a');
    buttons.forEach(button => {
      button.style.pointerEvents = 'auto';
      button.style.zIndex = '4';
    });
  }

  console.log('Applied emergency fixes to modal elements');
};

/**
 * Show a temporary overlay to visualize modal stacking
 */
export const showModalOverlay = () => {
  const modalElements = document.querySelectorAll('.modal-content, .ant-modal-content, .modal-container, .ant-modal, .modal-overlay');

  modalElements.forEach(el => {
    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.right = '0';
    overlay.style.bottom = '0';
    overlay.style.border = '3px solid red';
    overlay.style.background = 'rgba(255, 0, 0, 0.2)';
    overlay.style.zIndex = '9999';
    overlay.style.pointerEvents = 'none';
    overlay.className = 'modal-debug-overlay';

    const computed = window.getComputedStyle(el);
    const label = document.createElement('div');
    label.style.position = 'absolute';
    label.style.top = '0';
    label.style.left = '0';
    label.style.background = 'black';
    label.style.color = 'white';
    label.style.padding = '4px';
    label.style.fontSize = '12px';
    label.style.zIndex = '10000';
    label.innerText = `${el.className}\nz-index: ${computed.zIndex}\npointer-events: ${computed.pointerEvents}`;

    overlay.appendChild(label);
    el.appendChild(overlay);

    setTimeout(() => {
      el.removeChild(overlay);
    }, 5000);
  });

  console.log('Added debug overlays for 5 seconds');
};

/**
 * Apply an aggressive fix to prevent modal closing when clicked
 * This is a last resort solution for stubborn modal issues
 */
export const applyAggressiveFix = () => {
  console.log('Applying aggressive fix to prevent modal from closing...');

  // 1. Find all possible modal containers
  const containers = document.querySelectorAll('.modal-container, .ant-modal-root, .ant-modal-wrap, .modal-overlay');
  containers.forEach(container => {
    // Add a transparent overlay that intercepts clicks but lets them through to content
    const shield = document.createElement('div');
    shield.className = 'modal-click-shield';
    shield.style.position = 'fixed';
    shield.style.top = '0';
    shield.style.left = '0';
    shield.style.width = '100%';
    shield.style.height = '100%';
    shield.style.zIndex = '2000'; // Very high z-index
    shield.style.background = 'transparent';

    // Find the content element
    const contentElements = document.querySelectorAll('.modal-content, .ant-modal-content');

    // Create the click handler
    shield.addEventListener('click', (e) => {
      console.log('Shield click intercepted');

      // Check if the click is on content or backdrop
      let isContentClick = false;

      // Check if click is inside any content element
      contentElements.forEach(content => {
        const rect = content.getBoundingClientRect();
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          isContentClick = true;
        }
      });

      if (isContentClick) {
        // Let the click pass through to elements underneath for content clicks
        console.log('Content click - allowing interaction');
        shield.style.pointerEvents = 'none';

        // Find the element underneath and simulate a click
        const elementUnder = document.elementFromPoint(e.clientX, e.clientY);
        if (elementUnder) {
          elementUnder.click();
        }

        // Restore pointer events after a short delay
        setTimeout(() => {
          shield.style.pointerEvents = 'auto';
        }, 100);

        // Stop event from propagating to potential backdrop close handlers
        e.stopPropagation();
        e.preventDefault();
      } else {
        // For backdrop clicks, remove the shield and let the normal close behavior happen
        console.log('Backdrop click - allowing modal to close');
        document.body.removeChild(shield);
      }
    });

    // Add the shield to the body
    document.body.appendChild(shield);
    console.log('Added modal click shield');
  });

  // 2. Disable all existing click handlers on backdrops
  const backdrops = document.querySelectorAll('.modal-backdrop, .ant-modal-mask');
  backdrops.forEach(backdrop => {
    // Create a clone to remove all event listeners
    const clone = backdrop.cloneNode(true);
    if (backdrop.parentNode) {
      backdrop.parentNode.replaceChild(clone, backdrop);
    }
  });

  console.log('Aggressive fix applied!');
};

/**
 * Monitor all clicks to help diagnose what's happening with modal interactions
 */
export const monitorClicks = () => {
  console.log('Starting click monitor...');

  const clickHandler = (event) => {
    // Get information about the clicked element
    const target = event.target;
    const path = [];

    // Build the event path (all parents up to document)
    let current = target;
    while (current) {
      path.push({
        tagName: current.tagName,
        className: current.className,
        id: current.id,
        nodeType: current.nodeType
      });
      current = current.parentElement;
    }

    console.log('Click detected:', {
      target: {
        tagName: target.tagName,
        className: target.className,
        id: target.id
      },
      isModalContent: !!target.closest('.modal-content, .ant-modal-content'),
      isModalBackdrop: !!target.closest('.modal-backdrop, .ant-modal-mask'),
      path: path.slice(0, 5), // Show first 5 parents for brevity
      event
    });
  };

  // Add the listener
  document.addEventListener('click', clickHandler, true);

  // Return a function to stop monitoring
  return () => {
    document.removeEventListener('click', clickHandler, true);
    console.log('Click monitoring stopped');
  };
};

// Initialize modal debugging in development
if (process.env.NODE_ENV !== 'production') {
  setupModalDebugging();
}
