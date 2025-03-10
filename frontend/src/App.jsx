import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store';
import Home from './features/home/Home';
import Dashboard from './features/dashboard/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import ModalProvider from './providers/ModalProvider';
import './App.css';

function App() {
  return (
    <Provider store={store}>
      <ModalProvider>
        <div className="app">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </ModalProvider>
    </Provider>
  );
}

export default App;
