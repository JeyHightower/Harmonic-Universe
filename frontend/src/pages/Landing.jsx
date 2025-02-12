import { useSnackbar } from 'notistack';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login, setError, setLoading } from '../features/auth/authSlice';
import './Landing.css';

const Landing = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const { loading, error } = useSelector(state => state.auth);

  const handleDemoLogin = async () => {
    try {
      dispatch(setLoading(true));
      const response = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        dispatch(login(data));
        navigate('/dashboard');
        enqueueSnackbar('Welcome to Harmonic Universe!', {
          variant: 'success',
        });
      } else {
        throw new Error(data.message || 'Failed to login');
      }
    } catch (error) {
      dispatch(setError(error.message));
      enqueueSnackbar(error.message || 'Failed to login', { variant: 'error' });
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="landing-page fade-in">
      <main className="container">
        <div className="hero mt-2">
          <h1 className="text-center">Welcome to Harmonic Universe</h1>
          <p className="text-center mb-2">
            Explore and create harmonious universes with unique physical
            properties
          </p>

          <div className="cta-buttons text-center">
            <button
              onClick={handleDemoLogin}
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Try Demo'}
            </button>
            <button
              onClick={() => navigate('/login')}
              className="btn btn-secondary ml-2"
              disabled={loading}
            >
              Login
            </button>
          </div>
        </div>

        <div className="features mt-2">
          <div className="card-grid">
            <div className="card">
              <h3>Create Universes</h3>
              <p>
                Design and customize your own universes with unique physical
                properties
              </p>
            </div>
            <div className="card">
              <h3>Explore Scenes</h3>
              <p>
                Navigate through different scenes and witness harmonious
                interactions
              </p>
            </div>
            <div className="card">
              <h3>Collaborate</h3>
              <p>Share your universes and collaborate with other creators</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Landing;
