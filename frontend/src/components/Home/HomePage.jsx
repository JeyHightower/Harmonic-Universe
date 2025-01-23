import { Button, Container, Typography } from '@mui/material';
import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login } from '../../store/slices/authSlice';
import styles from './HomePage.module.css';

const HomePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleDemoLogin = async () => {
    try {
      const result = await dispatch(
        login({
          email: 'demo@example.com',
          password: 'demo123',
        })
      ).unwrap();

      if (result.token) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Demo login failed:', error);
    }
  };

  return (
    <Container className={styles.homeContainer}>
      <Typography variant="h1" className={styles.title}>
        Welcome to Harmonic Universe
      </Typography>
      <Typography variant="h5" className={styles.subtitle}>
        Create, explore, and shape your musical universe
      </Typography>

      <div className={styles.features}>
        <Typography variant="body1" className={styles.description}>
          Experience the power of collaborative storytelling and music creation.
          Our platform allows you to:
        </Typography>
        <ul className={styles.featureList}>
          <li>Create unique musical universes</li>
          <li>Collaborate with other creators</li>
          <li>Shape stories through interactive elements</li>
          <li>Explore endless possibilities</li>
        </ul>
      </div>

      <div className={styles.demoSection}>
        <Typography variant="h6" className={styles.demoTitle}>
          Try it out instantly!
        </Typography>
        <Typography variant="body2" className={styles.demoText}>
          No registration required. Click below to explore all features with our
          demo account.
        </Typography>
      </div>

      <div className={styles.buttonGroup}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/register')}
          className={styles.button}
        >
          Get Started
        </Button>
        <Button
          variant="outlined"
          color="primary"
          onClick={handleDemoLogin}
          className={styles.button}
        >
          Try Demo
        </Button>
      </div>
    </Container>
  );
};

export default HomePage;
