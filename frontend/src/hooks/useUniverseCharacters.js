import { useCallback, useState } from 'react';
import apiClient from '../services/api.adapter.mjs';

/**
 * Custom hook to fetch characters for a universe on demand (lazy loading).
 * Handles loading, error, and permission (403) states.
 * Returns: { characters, loading, error, fetchCharacters, reset }
 */
export default function useUniverseCharacters(universeId) {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fetched, setFetched] = useState(false);

  const fetchCharacters = useCallback(async () => {
    if (!universeId || loading || fetched) return;
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.universes.getUniverseCharacters(universeId);
      const data = response.data?.characters || response.data || [];
      setCharacters(data);
      setFetched(true);
    } catch (err) {
      if (err.response && err.response.status === 403) {
        setError('You do not have permission to view characters for this universe.');
      } else {
        setError('Failed to load characters. Please try again.');
      }
      setCharacters([]);
    } finally {
      setLoading(false);
    }
  }, [universeId, loading, fetched]);

  const reset = useCallback(() => {
    setCharacters([]);
    setError(null);
    setFetched(false);
  }, []);

  return { characters, loading, error, fetchCharacters, reset };
}
