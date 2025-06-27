import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { loadUniverses } from '../redux/universesSlice';

const Dashboard = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load universes
        const result = await dispatch(loadUniverses()).unwrap();

        // Check if we got valid data
        if (!result || !Array.isArray(result)) {
          throw new Error('Invalid universe data received');
        }

        setLoading(false);
      } catch (err) {
        console.error('Dashboard - loadUniverses failed in mount useEffect:', err);
        setError(err.message || 'Failed to load universes');
        setLoading(false);
      }
    };

    loadData();
  }, [dispatch]);

  return (
    <div>
      {/* Update the error display section */}
      {error && (
        <div className="error-message">
          <p>Error: {error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
