import { createAsyncThunk } from "@reduxjs/toolkit";
import api from '../../services/api.adapter';
import { AUTH_CONFIG } from '../../utils/config';

const handleError = (error) => {
  console.error("API Error:", error);
  return {
    message:
      error.response?.data?.message || error.message || "An error occurred",
    status: error.response?.status,
    data: error.response?.data,
  };
};

// Helper function to normalize universe data (especially date fields)
const normalizeUniverseData = (universe) => {
  if (!universe) return null;

  // Ensure dates are strings for consistent handling
  const normalized = {
    ...universe,
    created_at: universe.created_at ? universe.created_at.toString() : null,
    updated_at: universe.updated_at ? universe.updated_at.toString() : null,
  };

  return normalized;
};

// Helper function to normalize universes array
const normalizeUniverses = (universes) => {
  if (!universes || !Array.isArray(universes)) return [];
  return universes.map(normalizeUniverseData);
};

// Fetch all universes
export const fetchUniverses = createAsyncThunk(
  "universe/fetchUniverses",
  async (params, { rejectWithValue }) => {
    try {
      console.log("Fetching universes with params:", params);
      
      // First, check if there's already a token verification failure flag set
      const tokenVerificationFailed = localStorage.getItem("token_verification_failed");
      if (tokenVerificationFailed === "true") {
        console.error("Token verification previously failed, aborting universes fetch");
        // Clear the flag to allow future authentication attempts
        localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
        return rejectWithValue({
          message: "Authentication token verification failed. Please log in again.",
          status: 401,
          authError: true
        });
      }
      
      // Add a check for the token's existence
      const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
      if (!token) {
        console.error("No authentication token found");
        return rejectWithValue({
          message: "No authentication token found. Please log in again.",
          status: 401,
          authError: true
        });
      }
      
      // Try to validate token before making the actual request
      try {
        // Make a lightweight request first just to validate the token
        await api.auth.validateToken();
      } catch (validationError) {
        // If validation explicitly fails with a signature error, don't continue
        if (validationError.message?.includes("Signature verification failed") ||
            validationError.response?.data?.message?.includes("Signature verification failed")) {
          console.error("Token validation failed with signature verification error");
          localStorage.setItem("token_verification_failed", "true");
          localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
          return rejectWithValue({
            message: "Authentication token signature verification failed. Please log in again.",
            status: 401,
            authError: true
          });
        }
      }
      
      // If we get here, either validation succeeded or had a non-signature error we can try to proceed
      const response = await api.universes.getUniverses(params);
      console.log("Got universes response:", {
        status: response.status,
        data: response.data,
        hasUniverses: !!response.data?.universes,
        universesCount: response.data?.universes?.length || 0,
        headers: response.headers,
      });

      // Extract and normalize the data
      let universes = [];

      // Handle our mock response from development mode
      if (response.data && Array.isArray(response.data.universes)) {
        console.log("Found universes array in response.data.universes");
        universes = normalizeUniverses(response.data.universes);
      }
      // Handle other response formats
      else if (Array.isArray(response.data)) {
        console.log("Response.data is an array of universes");
        universes = normalizeUniverses(response.data);
      }
      else if (response.universes && Array.isArray(response.universes)) {
        console.log("Found universes array in response.universes");
        universes = normalizeUniverses(response.universes);
      }
      else if (response.data && response.data.data && Array.isArray(response.data.data.universes)) {
        console.log("Found universes array in response.data.data.universes");
        universes = normalizeUniverses(response.data.data.universes);
      }
      else if (Array.isArray(response)) {
        console.log("Response itself is an array of universes");
        universes = normalizeUniverses(response);
      }
      else {
        console.error("Unexpected universes response format:", response);
        universes = [];
      }

      console.log("Normalized universes:", {
        count: universes.length,
        isArray: Array.isArray(universes),
        hasData: !!universes,
        data: universes,
      });

      return { universes };
    } catch (error) {
      console.error("Error fetching universes:", {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers,
      });
      
      // Handle specific token verification errors
      if (error.response?.status === 401) {
        const errorMessage = error.response?.data?.message || "Authentication error";
        console.error(`Authentication error (401): ${errorMessage}`);
        
        // If there's a specific signature verification error, handle it specially
        if (errorMessage.includes("Signature verification failed") || 
            errorMessage.includes("Invalid token") || 
            errorMessage.includes("Token has expired")) {
          console.error("Token signature verification failed - token may be invalid");
          localStorage.setItem("token_verification_failed", "true");
          // Clear the invalid token
          localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
        }
        
        return rejectWithValue({
          message: errorMessage,
          status: 401,
          authError: true
        });
      }
      
      return rejectWithValue(handleError(error));
    }
  }
);

// Fetch a specific universe by ID
export const fetchUniverseById = createAsyncThunk(
  "universe/fetchUniverseById",
  async ({ id, includeScenes = false }, { rejectWithValue }) => {
    try {
      console.log(
        `Fetching universe ${id} with includeScenes=${includeScenes}`
      );
      const response = await api.universes.getUniverse(id);
      console.log("Got universe response:", response);

      // Normalize the universe data if present
      if (response && response.data && response.data.universe) {
        response.data.universe = normalizeUniverseData(response.data.universe);
      } else if (response && response.universe) {
        response.universe = normalizeUniverseData(response.universe);
      }

      return response.data || response;
    } catch (error) {
      console.error(`Error fetching universe ${id}:`, error);
      return rejectWithValue(handleError(error));
    }
  }
);

// Create a new universe
export const createUniverse = createAsyncThunk(
  "universe/createUniverse",
  async (universeData, { rejectWithValue }) => {
    try {
      console.log("Creating universe with data:", universeData);

      // Validate data
      if (!universeData.name) {
        console.error("Universe name is required");
        return rejectWithValue({
          message: "Universe name is required",
          status: 400
        });
      }

      // Ensure we have the correct data format
      const formattedData = {
        name: universeData.name,
        description: universeData.description || "",
        is_public: universeData.is_public !== undefined ? universeData.is_public : true
      };

      console.log("Sending formatted universe data:", formattedData);

      // Make the API call
      const response = await api.universes.createUniverse(formattedData);
      console.log("Created universe response:", response);

      // Handle our mock response from development mode
      if (response.data && response.data.universe) {
        console.log("Found universe object in response.data.universe");
        return response.data.universe;
      }

      // Other response formats
      if (response.universe) {
        console.log("Found universe object in response.universe");
        return normalizeUniverseData(response.universe);
      }

      if (response.id) {
        console.log("Response itself is the universe object");
        return normalizeUniverseData(response);
      }

      if (response.data && response.data.id) {
        console.log("Response.data itself is the universe object");
        return normalizeUniverseData(response.data);
      }

      console.warn("Unknown response format, returning full response:", response);
      return response.data || response;
    } catch (error) {
      console.error("Error creating universe:", error);
      console.error("Error details:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        stack: error.stack
      });

      // Try to extract more detailed error message from response
      const errorMessage = error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Error creating universe";

      return rejectWithValue({
        message: errorMessage,
        status: error.response?.status,
        data: error.response?.data
      });
    }
  }
);

// Update an existing universe
export const updateUniverse = createAsyncThunk(
  "universe/updateUniverse",
  async ({ id, ...updateData }, { rejectWithValue }) => {
    try {
      console.log(`Thunk - Updating universe ${id} with data:`, updateData);
      const response = await api.universes.updateUniverse(id, updateData);
      console.log("Thunk - Updated universe response:", response);

      // Normalize the universe data if present
      let normalizedData;
      if (response && response.data && response.data.universe) {
        normalizedData = normalizeUniverseData(response.data.universe);
        return { ...response.data, universe: normalizedData };
      } else if (response && response.universe) {
        normalizedData = normalizeUniverseData(response.universe);
        return { universe: normalizedData };
      } else if (response && response.data) {
        return response.data;
      } else if (response && response.id) {
        // If the response itself is the universe
        return normalizeUniverseData(response);
      }

      return response;
    } catch (error) {
      console.error(`Thunk - Error updating universe ${id}:`, error);

      // Check for specific error types
      if (error.response && error.response.status === 403) {
        return rejectWithValue({ message: "You don't have permission to update this universe" });
      } else if (error.response && error.response.status === 404) {
        return rejectWithValue({ message: "Universe not found" });
      } else if (error.response && error.response.status === 405) {
        return rejectWithValue({ message: "Method not allowed - please check API endpoint configuration" });
      } else if (error.response && error.response.status === 500) {
        const errorMessage = error.response.data?.error ||
          error.response.data?.message ||
          "Server error while updating universe";
        return rejectWithValue({ message: errorMessage });
      }

      return rejectWithValue(handleError(error));
    }
  }
);

// Delete a universe
export const deleteUniverse = createAsyncThunk(
  "universe/deleteUniverse",
  async (id, { rejectWithValue }) => {
    try {
      console.log(`Deleting universe ${id}`);
      const response = await api.universes.deleteUniverse(id);
      console.log("Delete universe response:", response);
      return { id, ...response.data };
    } catch (error) {
      console.error(`Error deleting universe ${id}:`, error);
      return rejectWithValue(handleError(error));
    }
  }
);

// Fetch scenes for a specific universe
export const fetchScenesForUniverse = createAsyncThunk(
  "universe/fetchScenesForUniverse",
  async (universeId, { rejectWithValue }) => {
    try {
      console.log(`Fetching scenes for universe ${universeId}`);
      const response = await api.scenes.getScenesByUniverse(universeId);
      console.log("Got scenes response:", response);
      return response.data || response;
    } catch (error) {
      console.error(`Error fetching scenes for universe ${universeId}:`, error);
      return rejectWithValue(handleError(error));
    }
  }
);

// Update physics parameters
export const updatePhysicsParams = createAsyncThunk(
  "universe/updatePhysicsParams",
  async ({ universeId, physicsParams }, { rejectWithValue }) => {
    try {
      console.log(
        `Updating physics params for universe ${universeId}:`,
        physicsParams
      );
      const response = await api.universes.updateUniverse(universeId, {
        physics_params: physicsParams,
      });
      console.log("Updated physics params response:", response);

      // Normalize the universe data if present
      if (response && response.data && response.data.universe) {
        response.data.universe = normalizeUniverseData(response.data.universe);
      } else if (response && response.universe) {
        response.universe = normalizeUniverseData(response.universe);
      } else if (response && response.id) {
        // If the response itself is the universe
        return normalizeUniverseData(response);
      }

      return response.data || response;
    } catch (error) {
      console.error(
        `Error updating physics params for universe ${universeId}:`,
        error
      );
      return rejectWithValue(handleError(error));
    }
  }
);

// Update harmony parameters
export const updateHarmonyParams = createAsyncThunk(
  "universe/updateHarmonyParams",
  async ({ universeId, harmonyParams }, { rejectWithValue }) => {
    try {
      console.log(
        `Updating harmony params for universe ${universeId}:`,
        harmonyParams
      );
      const response = await api.universes.updateUniverse(universeId, {
        harmony_params: harmonyParams,
      });
      console.log("Updated harmony params response:", response);

      // Normalize the universe data if present
      if (response && response.data && response.data.universe) {
        response.data.universe = normalizeUniverseData(response.data.universe);
      } else if (response && response.universe) {
        response.universe = normalizeUniverseData(response.universe);
      } else if (response && response.id) {
        // If the response itself is the universe
        return normalizeUniverseData(response);
      }

      return response.data || response;
    } catch (error) {
      console.error(
        `Error updating harmony params for universe ${universeId}:`,
        error
      );
      return rejectWithValue(handleError(error));
    }
  }
);
