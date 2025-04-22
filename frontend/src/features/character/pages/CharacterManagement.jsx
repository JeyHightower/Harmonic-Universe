import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { CharactersPage } from '..';

/**
 * Character Management component
 *
 * This component acts as a wrapper for the CharactersPage component
 * to ensure compatibility with the old route structure and prevent 404 errors.
 */
const CharacterManagement = () => {
  const { universeId } = useParams();

  // Validate universe ID
  if (!universeId || universeId === 'undefined' || universeId === 'null') {
    console.warn('CharacterManagement: Invalid universe ID, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  // Just render the CharactersPage component
  return <CharactersPage />;
};

export default CharacterManagement;
