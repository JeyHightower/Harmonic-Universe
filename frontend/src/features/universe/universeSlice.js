export const createUniverse = createAsyncThunk(
  'universes/create',
  async (universeData) => {
    try {
      // Format the data to match backend expectations
      const formattedData = {
        name: universeData.name,
        description: universeData.description,
        is_public: universeData.isPublic || false,
        physics_parameters: universeData.physics_parameters || {},
        harmony_parameters: universeData.harmony_parameters || {}
      };

      const response = await api.post('/universes/', formattedData);
      return response.data;
    } catch (error) {
      console.error('Error Response:', error.response?.data);
      throw new Error(error.response?.data?.error || 'Failed to create universe');
    }
  }
);
