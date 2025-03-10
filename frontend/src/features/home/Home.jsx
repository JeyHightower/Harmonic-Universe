import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { demoLogin } from '../../store/thunks/authThunks';
import './Home.css';

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleDemoLogin = async () => {
    try {
      const resultAction = await dispatch(demoLogin());
      if (demoLogin.fulfilled.match(resultAction)) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Demo login failed:', error);
    }
  };

  const handleLogin = () => {
    navigate('/?modal=login');
  };

  const handleSignup = () => {
    navigate('/?modal=register');
  };

  return (
    <div className="home-container">
      <div className="home-content">
        <h1>Welcome to Harmonic Universe</h1>
        <p>
          Experience the power of physics simulation and create your own universe.
        </p>
        <div className="home-actions">
          <button
            className="button button-primary"
            onClick={handleDemoLogin}
          >
            Try Demo
          </button>
          <button
            className="button button-secondary"
            onClick={handleLogin}
          >
            Login
          </button>
          <button
            className="button button-secondary"
            onClick={handleSignup}
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
