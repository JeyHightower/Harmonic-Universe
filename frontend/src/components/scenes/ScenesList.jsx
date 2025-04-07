import React, { useMemo } from "react";

// Filter scenes to show only non-deleted ones
const filteredScenes = useMemo(() => {
  // Start with all available scenes
  let result = scenes || [];

  // Filter out deleted scenes
  result = result.filter((scene) => scene && scene.is_deleted !== true);

  // Apply custom sorting if needed
  if (sortField) {
    result = result.sort((a, b) => {
      if (sortField === "order" || sortField === "id") {
        return sortDirection === "asc"
          ? (a[sortField] || 0) - (b[sortField] || 0)
          : (b[sortField] || 0) - (a[sortField] || 0);
      }

      const aValue = String(a[sortField] || "").toLowerCase();
      const bValue = String(b[sortField] || "").toLowerCase();

      return sortDirection === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });
  }

  return result;
}, [scenes, sortField, sortDirection]);
