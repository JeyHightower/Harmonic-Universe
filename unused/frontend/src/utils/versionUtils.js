const MAX_HISTORY_LENGTH = 50;

export const createVersion = (storyboard) => ({
  id: storyboard.id,
  plot_point: storyboard.plot_point,
  description: storyboard.description,
  harmony_tie: storyboard.harmony_tie,
  version: storyboard.version || 1,
  timestamp: new Date().toISOString(),
  changes: [],
});

export const compareVersions = (oldVersion, newVersion) => {
  const changes = [];

  if (oldVersion.plot_point !== newVersion.plot_point) {
    changes.push({
      field: "plot_point",
      type: "update",
      old: oldVersion.plot_point,
      new: newVersion.plot_point,
    });
  }

  if (oldVersion.description !== newVersion.description) {
    changes.push({
      field: "description",
      type: "update",
      old: oldVersion.description,
      new: newVersion.description,
    });
  }

  if (oldVersion.harmony_tie !== newVersion.harmony_tie) {
    changes.push({
      field: "harmony_tie",
      type: "update",
      old: oldVersion.harmony_tie,
      new: newVersion.harmony_tie,
    });
  }

  return changes;
};

export const addToHistory = (history, version) => {
  const newHistory = [version, ...history];
  if (newHistory.length > MAX_HISTORY_LENGTH) {
    newHistory.pop();
  }
  return newHistory;
};

export const restoreVersion = (version) => ({
  id: version.id,
  plot_point: version.plot_point,
  description: version.description,
  harmony_tie: version.harmony_tie,
  version: version.version,
});

export const formatChanges = (changes) => {
  return changes.map((change) => {
    switch (change.field) {
      case "plot_point":
        return `Plot point changed from "${change.old}" to "${change.new}"`;
      case "description":
        return "Description was updated";
      case "harmony_tie":
        return `Harmony value changed from ${change.old} to ${change.new}`;
      default:
        return `${change.field} was updated`;
    }
  });
};

export const getVersionDiff = (oldVersion, newVersion) => {
  const changes = compareVersions(oldVersion, newVersion);
  return {
    timestamp: newVersion.timestamp,
    version: newVersion.version,
    changes: formatChanges(changes),
    raw: changes,
  };
};
