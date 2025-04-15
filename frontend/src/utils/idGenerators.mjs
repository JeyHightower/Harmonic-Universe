/**
 * Generates a random ID string
 * @returns {string} A random ID string
 */
export const generateRandomId = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}; 