import React, { useMemo } from "react";
import PropTypes from "prop-types";
import SceneCard from "./SceneCard";

// Create a ScenesList component with the existing functionality
const ScenesList = ({ scenes, sortField, sortDirection }) => {
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

  return (
    <div className="scenes-list">
      {filteredScenes.map((scene) => (
        <SceneCard key={scene.id} scene={scene} />
      ))}
    </div>
  );
};

ScenesList.propTypes = {
  scenes: PropTypes.array,
  sortField: PropTypes.string,
  sortDirection: PropTypes.string
};

ScenesList.defaultProps = {
  scenes: [],
  sortField: "updated_at",
  sortDirection: "desc"
};

export default ScenesList;
