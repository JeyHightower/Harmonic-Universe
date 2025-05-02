/**
 * Ensures that the portal root element exists in the DOM.
 * If it doesn't exist, creates it and appends it to the body.
 *
 * @returns {HTMLElement} The portal root element
 */
export const ensurePortalRoot = () => {
  let portalRoot = document.getElementById("portal-root");

  if (!portalRoot) {
    console.log("Creating new portal root element");
    portalRoot = document.createElement("div");
    portalRoot.id = "portal-root";

    // Set styles directly on the portal root for better visibility management
    portalRoot.style.position = "fixed";
    portalRoot.style.top = "0";
    portalRoot.style.left = "0";
    portalRoot.style.right = "0";
    portalRoot.style.bottom = "0";
    portalRoot.style.zIndex = "1050"; // Standardized z-index to match modals
    portalRoot.style.pointerEvents = "none"; // Changed to none to allow clicks to pass through
    portalRoot.style.isolation = "isolate"; // Create a new stacking context

    document.body.appendChild(portalRoot);
    console.log("Portal root created and appended to body");
  } else {
    console.log("Using existing portal root");

    // Ensure existing portal has the correct styles
    portalRoot.style.position = "fixed";
    portalRoot.style.top = "0";
    portalRoot.style.left = "0";
    portalRoot.style.right = "0";
    portalRoot.style.bottom = "0";
    portalRoot.style.zIndex = "1050"; // Standardized z-index to match modals
    portalRoot.style.pointerEvents = "none"; // Changed to none to allow clicks to pass through
    portalRoot.style.isolation = "isolate"; // Create a new stacking context
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
    container = document.createElement("div");
    container.id = id;
    container.className = "portal-container";
    container.style.pointerEvents = "auto";
    container.style.position = "relative"; // Ensure proper stacking context
    container.style.zIndex = "1"; // Allow stacking within portal root
    portalRoot.appendChild(container);
    console.log(`Portal container ${id} created`);
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
    container.parentElement.removeChild(container);
  }
};

/**
 * Clean up all portal containers and reset the DOM state
 * Useful for complete modal system reset
 */
export const cleanupAllPortals = () => {
  const portalRoot = document.getElementById("portal-root");
  if (portalRoot) {
    console.log("Cleaning up all portal containers");
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
  }
};
