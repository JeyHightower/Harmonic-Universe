import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { demoLogin } from '../store/authThunks';
import useModal from '../hooks/useModal.js';
import { MODAL_TYPES } from '../utils/modalRegistry.js';
import '../styles/Home.css';

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { openModal } = useModal();

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
    openModal(MODAL_TYPES.LOGIN);
  };

  const handleSignup = () => {
    openModal(MODAL_TYPES.SIGNUP);
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
