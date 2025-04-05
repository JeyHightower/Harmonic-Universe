import axios from 'axios';
import { API_CONFIG, AUTH_CONFIG } from './config';

// Keep track of the last request time for specific endpoints
const lastRequestTimes = {};
const MIN_REQUEST_INTERVAL = 1000; // 1 second minimum between requests to the same endpoint

/**
 * Makes a rate-limited API request by ensuring minimum time between requests to the same endpoint
 * 
 * @param {Function} requestFn - Function that returns a promise to make the request
 * @param {string} endpointKey - Key to identify the endpoint (for rate limiting)
 * @returns {Promise} - Promise that resolves with the response
 */
const rateLimitedRequest = async (requestFn, endpointKey) => {
  const now = Date.now();
  const lastRequestTime = lastRequestTimes[endpointKey] || 0;
  const timeSinceLastRequest = now - lastRequestTime;

  // If we've made a request to this endpoint recently, delay this one
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const delayNeeded = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    console.log(`Rate limiting: Delaying request to ${endpointKey} by ${delayNeeded}ms`);

    // Wait before proceeding
    await new Promise(resolve => setTimeout(resolve, delayNeeded));
  }

  // Update the last request time for this endpoint
  lastRequestTimes[endpointKey] = Date.now();

  // Make the actual request
  return requestFn();
};

/**
 * Make an API request with retry logic and exponential backoff
 * Specifically handles 429 Too Many Requests errors
 *
 * @param {Object} config - Axios request configuration
 * @param {number} maxRetries - Maximum number of retries (default: 3)
 * @param {number} baseDelay - Base delay in milliseconds (default: 1000)
 * @returns {Promise} - Promise with the response or error
 */
export const requestWithRetry = async (config, maxRetries = 3, baseDelay = 1000) => {
  let retryCount = 0;

  // Create an endpoint key for rate limiting
  const endpointKey = `${config.method || 'get'}-${config.url}`;

  const makeRequest = async () => {
    try {
      // Get authentication token
      const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);

      // Add Authorization header if token exists
      if (token) {
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${token}`
        };
        console.log(`[API DEBUG] Adding token to request: Bearer ${token.substring(0, 10)}...`);
      } else {
        console.warn("[API DEBUG] No authentication token found in localStorage!");
      }

      console.log(`[API DEBUG] Request URL: ${config.url}`);
      console.log(`[API DEBUG] Request Headers:`, config.headers);

      // Use axios directly to make the request, but rate limited
      return await rateLimitedRequest(() => axios(config), endpointKey);
    } catch (error) {
      console.error(`[API DEBUG] Request failed: ${error.message}`, error.response?.data);

      // Check if it's a rate limit error (429) and we have retries left
      if (error.response?.status === 429 && retryCount < maxRetries) {
        // Increment retry counter
        retryCount++;

        // Calculate delay with exponential backoff
        const delay = Math.pow(2, retryCount) * baseDelay;

        console.log(`Rate limited (429), retrying in ${delay}ms... (attempt ${retryCount}/${maxRetries})`);

        // Wait for the calculated delay
        await new Promise(resolve => setTimeout(resolve, delay));

        // Try again recursively
        return makeRequest();
      }

      // For other errors or when we've exhausted retries, just throw
      throw error;
    }
  };

  return makeRequest();
};

/**
 * Helper function to get a character with retry logic
 * 
 * @param {string|number} characterId - The ID of the character to fetch
 * @returns {Promise} - Promise with the character data
 */
export const getCharacterWithRetry = async (characterId) => {
  try {
    // Create an endpoint key for rate limiting
    const endpointKey = `get-character-${characterId}`;

    // Use rate-limited request with retry
    const response = await rateLimitedRequest(() =>
      requestWithRetry({
        method: 'get',
        url: `${API_CONFIG.BASE_URL}/characters/${characterId}`,
        headers: API_CONFIG.HEADERS,
        withCredentials: true,
      }),
      endpointKey
    );

    return response.data;
  } catch (error) {
    console.error('Error fetching character:', error);
    throw error;
  }
};

/**
 * Get all characters with retry logic
 * 
 * @returns {Promise} - Promise with the characters data
 */
export const getAllCharactersWithRetry = async () => {
  try {
    // Create an endpoint key for rate limiting
    const endpointKey = 'get-all-characters';

    // Use rate-limited request with retry
    const response = await rateLimitedRequest(() =>
      requestWithRetry({
        method: 'get',
        url: `${API_CONFIG.BASE_URL}/characters`,
        headers: API_CONFIG.HEADERS,
        withCredentials: true,
      }),
      endpointKey
    );

    return response.data;
  } catch (error) {
    console.error('Error fetching all characters:', error);
    throw error;
  }
};

export default {
  requestWithRetry,
  getCharacterWithRetry,
  getAllCharactersWithRetry,
  rateLimitedRequest
}; 