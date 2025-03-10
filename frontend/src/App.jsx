import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<div>Welcome to Harmonic Universe</div>} />
      </Routes>
    </div>
  );
}

export default App;
