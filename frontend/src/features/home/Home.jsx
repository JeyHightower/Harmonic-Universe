import React from 'react';
import { useSafeState } from '../../utils/react-safety-patch.jsx';
import apiClient from '../../utils/api';

const Home = () => {
  const [universes, setUniverses] = useSafeState([]);
  const [loading, setLoading] = useSafeState(true);
  const [error, setError] = useSafeState(null);

  React.useEffect(() => {
    const fetchUniverses = async () => {
      try {
        const response = await apiClient.getUniverses();
        setUniverses(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to load universes');
        console.error('Error fetching universes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUniverses();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="home">
      <h1>Welcome to Harmonic Universe</h1>
      <div className="universes-list">
        {universes.length === 0 ? (
          <p>No universes found. Create your first one!</p>
        ) : (
          universes.map((universe) => (
            <div key={universe.id} className="universe-card">
              <h3>{universe.name}</h3>
              <p>{universe.description}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Home;
