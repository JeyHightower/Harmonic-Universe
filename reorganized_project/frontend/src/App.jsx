import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store';

// Import components
import Layout from './components/Layout';
import UniverseManager from './features/universe/UniverseManager';
import UniverseDetail from './features/universe/UniverseDetail';
import SceneManager from './features/scene/SceneManager';
import SceneDetail from './features/scene/SceneDetail';
import PhysicsObjectsManager from './features/physics/PhysicsObjectsManager';
import PhysicsParametersManager from './features/physics/PhysicsParametersManager';
import Login from './features/auth/Login';
import Register from './features/auth/Register';
import NotFound from './components/NotFound';

import './styles/App.css';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Layout>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Universe routes */}
            <Route path="/" element={<UniverseManager />} />
            <Route path="/universes/:universeId" element={<UniverseDetail />} />
            
            {/* Scene routes */}
            <Route path="/scenes" element={<SceneManager />} />
            <Route path="/scenes/:sceneId" element={<SceneDetail />} />
            
            {/* Physics routes */}
            <Route path="/physics/objects" element={<PhysicsObjectsManager />} />
            <Route path="/physics/parameters" element={<PhysicsParametersManager />} />
            
            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </Router>
    </Provider>
  );
}

export default App;
