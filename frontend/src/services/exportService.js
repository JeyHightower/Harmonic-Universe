import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import api from './api';

export const exportService = {
  async exportUniverse(universeId) {
    try {
      // Fetch all universe data
      const universeData = await api.get(`/universes/${universeId}`);
      const physicsData = await api.get(`/universes/${universeId}/physics`);
      const audioData = await api.get(`/universes/${universeId}/audio`, {
        responseType: 'blob',
      });

      // Create JSON file
      const parametersJson = JSON.stringify(
        {
          universe: universeData.data,
          physics: physicsData.data,
        },
        null,
        2
      );

      // Create ZIP file
      const zip = new JSZip();
      zip.file('parameters.json', parametersJson);
      zip.file('harmony.wav', audioData.data);

      // Generate and download ZIP
      const content = await zip.generateAsync({ type: 'blob' });
      const fileName = `${universeData.data.name
        .toLowerCase()
        .replace(/\s+/g, '_')}_export.zip`;
      saveAs(content, fileName);

      return true;
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  },

  async importUniverse(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/universes/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Import failed:', error);
      throw error;
    }
  },
};
