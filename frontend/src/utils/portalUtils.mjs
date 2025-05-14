/**
 * Ensures that the portal root element exists in the DOM.
 * If it doesn't exist, creates it and appends it to the body.
 *
 * @returns {HTMLElement} The portal root element
 */
export const ensurePortalRoot = () => {
  let portalRoot = document.getElementById('portal-root');

  if (!portalRoot) {
    console.log('Creating new portal root element');
    portalRoot = document.createElement('div');
    portalRoot.id = 'portal-root';

    // Set styles directly on the portal root for better visibility management
    portalRoot.style.position = 'fixed';
    portalRoot.style.top = '0';
    portalRoot.style.left = '0';
    portalRoot.style.right = '0';
    portalRoot.style.bottom = '0';
    portalRoot.style.zIndex = '1050'; // Standardized z-index to match modals
    // We want the root element to not capture pointer events so they go to the actual content
    portalRoot.style.pointerEvents = 'none';
    portalRoot.style.isolation = 'isolate'; // Create a new stacking context

    document.body.appendChild(portalRoot);
    console.log('Portal root created and appended to body');
  } else {
    console.log('Using existing portal root');

    // Ensure existing portal has the correct styles
    portalRoot.style.position = 'fixed';
    portalRoot.style.top = '0';
    portalRoot.style.left = '0';
    portalRoot.style.right = '0';
    portalRoot.style.bottom = '0';
    portalRoot.style.zIndex = '1050'; // Standardized z-index to match modals
    portalRoot.style.pointerEvents = 'none'; // Important: allow clicks to pass through
    portalRoot.style.isolation = 'isolate'; // Create a new stacking context
  }

  return portalRoot;
};

/**
 * Gets the portal root element.
 * If it doesn't exist, creates it.
 *
 * @returns {HTMLElement} The portal root element
 */
export const getPortalRoot = () => {
  return ensurePortalRoot();
};

/**
 * Creates a new portal container within the portal root.
 * Useful for creating separate portals for different modal types.
 *
 * @param {string} id - The ID for the new portal container
 * @returns {HTMLElement} The new portal container
 */
export const createPortalContainer = (id) => {
  const portalRoot = ensurePortalRoot();
  let container = document.getElementById(id);

  if (!container) {
    container = document.createElement('div');
    container.id = id;
    container.className = 'portal-container';
    // Container MUST have pointer-events: auto to capture clicks
    container.style.pointerEvents = 'auto';
    container.style.position = 'relative';
    container.style.zIndex = '1';
    container.setAttribute('data-portal-container', 'true');

    // Add specific event listeners to ensure proper event handling
    // Click handler for the container itself - only stop propagation for backdrop clicks
    container.addEventListener(
      'click',
      (e) => {
        const isBackdropClick = e.target === container;
        const isCloseButton = e.target.closest('.modal-close, .ant-modal-close');

        // Don't stop propagation for close buttons or non-backdrop clicks
        if (isBackdropClick && !isCloseButton) {
          console.log('Backdrop click intercepted in portal container');
        } else {
          // For all other clicks inside content, stop propagation to prevent unintended closes
          e.stopPropagation();
        }
      },
      true
    ); // Use capture phase to ensure we get events first

    // Enhanced mousedown handler for form fields - crucial for interaction
    container.addEventListener(
      'mousedown',
      (e) => {
        // Get the target element and its tag
        const target = e.target;
        const tagName = target.tagName.toLowerCase();
        const isFormElement =
          tagName === 'input' ||
          tagName === 'textarea' ||
          tagName === 'select' ||
          tagName === 'button' ||
          target.getAttribute('role') === 'button' ||
          target.classList.contains('btn') ||
          target.classList.contains('button');

        // Special handling for form elements
        if (isFormElement) {
          // Always stop propagation for form elements to prevent modal from closing
          e.stopPropagation();
          e.stopImmediatePropagation();

          // Set timeout to focus after a slight delay - helps with input fields
          setTimeout(() => {
            if (document.activeElement !== target) {
              target.focus();
            }
          }, 10);
        }
      },
      true
    ); // Use capture phase to ensure we handle events first

    // Make sure logout buttons and action buttons work properly
    container.addEventListener(
      'click',
      (e) => {
        const isButton =
          e.target.tagName.toLowerCase() === 'button' ||
          e.target.getAttribute('role') === 'button' ||
          e.target.classList.contains('btn') ||
          e.target.classList.contains('button') ||
          e.target.closest('button') ||
          e.target.closest('[role="button"]');

        if (isButton) {
          // Apply specific handling for buttons
          e.stopPropagation(); // Stop propagation to prevent backdrop click
          e.target.style.pointerEvents = 'auto';
          e.target.style.cursor = 'pointer';

          // Make parent containers interactive too
          let parent = e.target.parentElement;
          while (parent && parent !== container) {
            parent.style.pointerEvents = 'auto';
            parent = parent.parentElement;
          }
        }
      },
      true
    );

    // Add touchstart handlers for mobile support
    container.addEventListener(
      'touchstart',
      (e) => {
        const target = e.target;
        const tagName = target.tagName.toLowerCase();

        if (
          tagName === 'input' ||
          tagName === 'textarea' ||
          tagName === 'select' ||
          tagName === 'button' ||
          target.getAttribute('role') === 'button' ||
          target.classList.contains('btn') ||
          target.classList.contains('button')
        ) {
          e.stopPropagation();

          // Ensure input fields get focus
          if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
            setTimeout(() => target.focus(), 10);
          }
        }
      },
      true
    );

    portalRoot.appendChild(container);
    console.log(`Portal container ${id} created`);

    // Apply immediate fixes to all form elements in the container
    fixModalFormElements(container);
  }

  return container;
};

/**
 * Cleans up portal containers that are no longer needed.
 *
 * @param {string} id - The ID of the portal container to remove
 */
export const removePortalContainer = (id) => {
  const container = document.getElementById(id);
  if (container && container.parentElement) {
    console.log(`Removing portal container ${id}`);
    // Remove event listeners to prevent memory leaks
    const newContainer = container.cloneNode(true);
    if (container.parentElement) {
      container.parentElement.replaceChild(newContainer, container);
      newContainer.parentElement.removeChild(newContainer);
    }
  }
};

/**
 * Clean up all portal containers and reset the DOM state
 * Useful for complete modal system reset
 */
export const cleanupAllPortals = () => {
  const portalRoot = document.getElementById('portal-root');
  if (portalRoot) {
    console.log('Cleaning up all portal containers');
    // Remove all children
    while (portalRoot.firstChild) {
      portalRoot.removeChild(portalRoot.firstChild);
    }

    // Reset body styles that might have been set by modals
    document.body.classList.remove('modal-open');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.overflow = '';

    // Optionally scroll back to top or previous position if needed
    window.scrollTo(0, 0);
  }
};

/**
 * Applies fixes to form elements inside modals to make them interactive
 * This should be called when modals with forms are having click issues
 */
export const fixModalFormElements = (container = document) => {
  // Find all form elements inside modals
  const formElements = container.querySelectorAll(
    '.modal-body input, .modal-body textarea, .modal-body select, .modal-body button, ' +
      '.ant-modal-body input, .ant-modal-body textarea, .ant-modal-body select, .ant-modal-body button, ' +
      '.modal-content input, .modal-content textarea, .modal-content select, .modal-content button, ' +
      'form input, form textarea, form select, form button, ' +
      '.form-control, [role="button"], .btn, .button'
  );

  formElements.forEach((el) => {
    // Ensure these elements can receive clicks
    el.style.pointerEvents = 'auto';
    el.style.position = 'relative';
    el.style.zIndex = '10';

    // If it's a button, make sure it's clickable
    if (
      el.tagName.toLowerCase() === 'button' ||
      el.getAttribute('role') === 'button' ||
      el.classList.contains('btn') ||
      el.classList.contains('button') ||
      el.type === 'submit' ||
      el.type === 'button'
    ) {
      el.style.cursor = 'pointer';
    }

    // Add mousedown handler to ensure focus
    const mousedownHandler = (e) => {
      e.stopPropagation();
      e.stopImmediatePropagation();

      // Explicitly focus after a small delay
      setTimeout(() => {
        if (document.activeElement !== e.target) {
          e.target.focus();
        }
      }, 10);
    };

    // Remove any existing handler to avoid duplicates
    el.removeEventListener('mousedown', el._mousedownHandler);
    el._mousedownHandler = mousedownHandler;
    el.addEventListener('mousedown', mousedownHandler, true);

    // Add click handler for buttons
    if (
      el.tagName.toLowerCase() === 'button' ||
      el.getAttribute('role') === 'button' ||
      el.classList.contains('btn') ||
      el.classList.contains('button') ||
      el.type === 'submit' ||
      el.type === 'button'
    ) {
      const clickHandler = (e) => {
        e.stopPropagation();
        // Don't prevent default to allow normal button behavior
      };

      el.removeEventListener('click', el._clickHandler);
      el._clickHandler = clickHandler;
      el.addEventListener('click', clickHandler, true);
    }
  });

  return formElements.length;
};

/**
 * Adds direct DOM interaction handlers to fix click and interaction issues
 * Call this in components that have interaction problems
 */
export const applyInteractionFixes = () => {
  console.log('Applying comprehensive modal interaction fixes');

  // Flag to track if fixes have been applied
  if (window.__interactionFixesApplied) {
    console.log('Interaction fixes already applied, refreshing...');
  }
  window.__interactionFixesApplied = true;

  // Enable pointer events on the body
  document.body.style.pointerEvents = 'auto';

  // Fix portal root pointer events - make it "none" to let clicks go through to content
  const portalRoot = document.getElementById('portal-root');
  if (portalRoot) {
    portalRoot.style.pointerEvents = 'none';

    // However, make all direct children of portal root have pointer-events: auto
    Array.from(portalRoot.children).forEach((child) => {
      child.style.pointerEvents = 'auto';
    });
  }

  // Fix all modals in the DOM
  const modalElements = document.querySelectorAll(
    '.modal-content, .modal-body, .ant-modal-body, .modal-container, ' +
      '.modal-inner-content, .stable-modal, .modal-interactive, form'
  );

  modalElements.forEach((el) => {
    el.style.pointerEvents = 'auto';
    el.style.touchAction = 'auto';
    el.style.position = 'relative';
    el.style.zIndex = '100';

    // Prevent events from propagating outside the modal
    el.removeEventListener('click', el._clickHandler);
    el._clickHandler = (e) => {
      if (e.target === el) {
        e.stopPropagation();
      }
    };
    el.addEventListener('click', el._clickHandler, true);

    // Add direct event listeners for inputs
    const inputs = el.querySelectorAll(
      'input, textarea, select, button, [role="button"], .btn, .button'
    );
    inputs.forEach((input) => {
      input.style.pointerEvents = 'auto';
      input.style.touchAction = 'auto';
      input.style.cursor =
        input.tagName.toLowerCase() === 'button' ||
        input.type === 'button' ||
        input.type === 'submit'
          ? 'pointer'
          : 'text';
      input.style.zIndex = '10';
      input.style.position = 'relative';

      // Remove any existing handlers
      input.removeEventListener('mousedown', input._mousedownHandler);
      input.removeEventListener('click', input._clickHandler);
      input.removeEventListener('focus', input._focusHandler);

      // Add mousedown handler for focus management
      const mousedownHandler = (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();

        // Focus the element if it's a form field
        if (
          input.tagName.toLowerCase() === 'input' ||
          input.tagName.toLowerCase() === 'textarea' ||
          input.tagName.toLowerCase() === 'select'
        ) {
          if (document.activeElement !== input) {
            setTimeout(() => input.focus(), 0);
          }
        }
      };

      // Click handler to stop propagation
      const clickHandler = (e) => {
        e.stopPropagation();

        // Special handling for buttons
        if (
          input.tagName.toLowerCase() === 'button' ||
          input.type === 'button' ||
          input.type === 'submit' ||
          input.getAttribute('role') === 'button' ||
          input.classList.contains('btn') ||
          input.classList.contains('button')
        ) {
          // Let the default action happen, just stop propagation
          console.log('Button clicked:', input.textContent || input.value);
        }
      };

      // Focus handler
      const focusHandler = (e) => {
        e.stopPropagation();
      };

      input._mousedownHandler = mousedownHandler;
      input._clickHandler = clickHandler;
      input._focusHandler = focusHandler;

      input.addEventListener('mousedown', mousedownHandler, true);
      input.addEventListener('click', clickHandler, true);
      input.addEventListener('focus', focusHandler, true);

      // Also add touch events for mobile
      input.addEventListener('touchstart', mousedownHandler, true);
    });
  });

  // Fix the logout and action buttons specifically
  const actionButtons = document.querySelectorAll(
    '.logout-button, .login-button, .signup-button, .auth-button, ' +
      '.modal-footer button, .modal-actions button, .ant-modal-footer button, ' +
      '[data-action], [role="button"], .btn, .button'
  );

  actionButtons.forEach((button) => {
    button.style.pointerEvents = 'auto';
    button.style.cursor = 'pointer';
    button.style.zIndex = '100';
    button.style.position = 'relative';

    // Make sure click events work
    const clickHandler = (e) => {
      // Stop propagation but allow the default button action
      e.stopPropagation();
      console.log('Action button clicked:', button.textContent);
    };

    button.removeEventListener('click', button._clickHandler);
    button._clickHandler = clickHandler;
    button.addEventListener('click', clickHandler, true);

    // Also strengthen all parent elements
    let parent = button.parentElement;
    while (parent && parent.nodeType === Node.ELEMENT_NODE) {
      parent.style.pointerEvents = 'auto';
      parent = parent.parentElement;
    }
  });

  // Add global helper function for debugging
  window.__fixInteractions = () => {
    console.log('Manually reapplying interaction fixes');
    applyInteractionFixes();
    fixModalFormElements();
    createSpecializedHandlers();
  };

  return true;
};

/**
 * Creates specialized handlers for specific form elements that need extra attention
 * @param {Element} container - The container element to search within (defaults to document)
 */
export const createSpecializedHandlers = (container = document) => {
  // Fix logout button specifically
  const logoutButtons = container.querySelectorAll('.logout-button, [data-action="logout"]');
  logoutButtons.forEach((btn) => {
    // Apply aggressive styling
    btn.style.pointerEvents = 'auto !important';
    btn.style.cursor = 'pointer !important';
    btn.style.zIndex = '9999';

    // Add a very aggressive click handler
    const logoutHandler = (e) => {
      e.stopPropagation();
      console.log('Logout button clicked');
      // Allow the default action to proceed
      return true;
    };

    btn.removeEventListener('click', btn._logoutHandler);
    btn._logoutHandler = logoutHandler;
    btn.addEventListener('click', logoutHandler, true);
  });

  // Special fix for form inputs
  const formInputs = container.querySelectorAll(
    'input[type="text"], input[type="email"], input[type="password"], textarea'
  );
  formInputs.forEach((input) => {
    // Style fixes
    input.style.pointerEvents = 'auto';
    input.style.zIndex = '50';

    // Enhanced focus handler
    const focusHandler = (e) => {
      e.stopPropagation();
      setTimeout(() => input.focus(), 0);
    };

    input.removeEventListener('mousedown', input._focusHandler);
    input._focusHandler = focusHandler;
    input.addEventListener('mousedown', focusHandler, true);
  });

  return {
    logoutButtons: logoutButtons.length,
    formInputs: formInputs.length,
  };
};

/**
 * Export a function to clean up all interaction fixes
 */
export const cleanupInteractionFixes = () => {
  // Remove all event handlers added by applyInteractionFixes
  const elements = document.querySelectorAll(
    '*[_clickHandler], *[_mousedownHandler], *[_focusHandler], *[_logoutHandler], *[_fixedHandler]'
  );

  elements.forEach((el) => {
    if (el._clickHandler) {
      el.removeEventListener('click', el._clickHandler);
      delete el._clickHandler;
    }

    if (el._mousedownHandler) {
      el.removeEventListener('mousedown', el._mousedownHandler);
      delete el._mousedownHandler;
    }

    if (el._focusHandler) {
      el.removeEventListener('focus', el._focusHandler);
      delete el._focusHandler;
    }

    if (el._logoutHandler) {
      el.removeEventListener('click', el._logoutHandler);
      delete el._logoutHandler;
    }

    if (el._fixedHandler) {
      el.removeEventListener('mousedown', el._fixedHandler, true);
      el.removeEventListener('touchstart', el._fixedHandler, true);
      el.removeEventListener('click', el._fixedHandler, true);
      delete el._fixedHandler;
    }
  });

  window.__interactionFixesApplied = false;
  console.log('Interaction fixes cleaned up');

  return true;
};
