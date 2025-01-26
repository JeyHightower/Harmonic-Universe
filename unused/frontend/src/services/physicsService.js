import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export const physicsService = {
  async getPhysicsParameters(universeId) {
    try {
      const response = await axios.get(
        `${API_URL}/universes/${universeId}/physics`,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching physics parameters:", error);
      throw error;
    }
  },

  async updatePhysicsParameters(universeId, parameters) {
    try {
      const response = await axios.put(
        `${API_URL}/universes/${universeId}/physics`,
        parameters,
      );
      return response.data;
    } catch (error) {
      console.error("Error updating physics parameters:", error);
      throw error;
    }
  },

  async getParticleState(universeId) {
    try {
      const response = await axios.get(
        `${API_URL}/universes/${universeId}/physics/particles`,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching particle state:", error);
      throw error;
    }
  },

  async updateParticleState(universeId, particles) {
    try {
      const response = await axios.put(
        `${API_URL}/universes/${universeId}/physics/particles`,
        particles,
      );
      return response.data;
    } catch (error) {
      console.error("Error updating particle state:", error);
      throw error;
    }
  },

  async getForceFields(universeId) {
    try {
      const response = await axios.get(
        `${API_URL}/universes/${universeId}/physics/fields`,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching force fields:", error);
      throw error;
    }
  },

  async updateForceField(universeId, fieldId, fieldData) {
    try {
      const response = await axios.put(
        `${API_URL}/universes/${universeId}/physics/fields/${fieldId}`,
        fieldData,
      );
      return response.data;
    } catch (error) {
      console.error("Error updating force field:", error);
      throw error;
    }
  },

  async createForceField(universeId, fieldData) {
    try {
      const response = await axios.post(
        `${API_URL}/universes/${universeId}/physics/fields`,
        fieldData,
      );
      return response.data;
    } catch (error) {
      console.error("Error creating force field:", error);
      throw error;
    }
  },

  async deleteForceField(universeId, fieldId) {
    try {
      await axios.delete(
        `${API_URL}/universes/${universeId}/physics/fields/${fieldId}`,
      );
    } catch (error) {
      console.error("Error deleting force field:", error);
      throw error;
    }
  },
};
