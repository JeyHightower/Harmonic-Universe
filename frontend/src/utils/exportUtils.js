export const exportToJSON = (storyboards, universeId) => {
  const exportData = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    universeId,
    storyboards: storyboards.map(storyboard => ({
      ...storyboard,
      version: 1,
      exportedAt: new Date().toISOString(),
    })),
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `storyboard-export-${universeId}-${new Date().toISOString()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToMarkdown = (storyboards, universeId) => {
  let markdown = `# Storyboard Export - Universe ${universeId}\n`;
  markdown += `Generated on: ${new Date().toLocaleString()}\n\n`;

  storyboards.forEach((storyboard, index) => {
    markdown += `## ${index + 1}. ${storyboard.plot_point}\n\n`;
    markdown += `- Harmony: ${storyboard.harmony_tie}\n`;
    markdown += `- Created: ${new Date(
      storyboard.created_at
    ).toLocaleString()}\n\n`;
    markdown += `### Description\n\n${storyboard.description}\n\n`;
    markdown += '---\n\n';
  });

  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `storyboard-export-${universeId}-${new Date().toISOString()}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const validateImportData = data => {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid import data format');
  }

  if (!data.version || !data.universeId || !Array.isArray(data.storyboards)) {
    throw new Error('Missing required fields in import data');
  }

  data.storyboards.forEach(storyboard => {
    if (
      !storyboard.plot_point ||
      !storyboard.description ||
      typeof storyboard.harmony_tie !== 'number'
    ) {
      throw new Error('Invalid storyboard data in import file');
    }
  });

  return true;
};

export const importFromJSON = async file => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = event => {
      try {
        const data = JSON.parse(event.target.result);
        if (validateImportData(data)) {
          resolve(data);
        }
      } catch (error) {
        reject(new Error('Failed to parse import file: ' + error.message));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read import file'));
    reader.readAsText(file);
  });
};
