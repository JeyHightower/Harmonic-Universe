export const ensurePortalRoot = () => {
  let portalRoot = document.getElementById("portal-root");

  if (!portalRoot) {
    portalRoot = document.createElement("div");
    portalRoot.id = "portal-root";
    document.body.appendChild(portalRoot);
  }

  return portalRoot;
};

export const getPortalRoot = () => {
  return document.getElementById("portal-root");
};
