import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConfigProvider } from 'antd';
import store from './store/store';
import Home from './features/Home.jsx';
import Dashboard from './features/Dashboard.jsx';
import UniverseDetail from './features/UniverseDetail.jsx';
import UniverseList from './features/UniverseList.jsx';
import SceneDetail from './features/SceneDetail.jsx';
import NotFound from './features/NotFound.jsx';
import ProfilePage from './features/ProfilePage.jsx';
import SettingsPage from './features/SettingsPage.jsx';
import PhysicsPage from './features/PhysicsPage.jsx';
import HarmonyPage from './features/HarmonyPage.jsx';
import StoryboardList from './features/StoryboardList.jsx';
import StoryboardDetail from './features/StoryboardDetail.jsx';
import StoryboardEditor from './features/StoryboardEditor.jsx';
import GlobalModal from './components/GlobalModal.jsx';
import NetworkErrorAlert from './components/NetworkErrorAlert';

const App = () => {
  return (
    <Provider store={store}>
      <ConfigProvider>
        <div className="app">
          <Routes>
            {/* Main routes */}
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Universe routes */}
            <Route path="/universes" element={<UniverseList />} />
            <Route path="/universes/:id" element={<UniverseDetail />} />
            <Route path="/universes/:id/edit" element={<UniverseDetail />} />

            {/* Scene routes */}
            <Route path="/universes/:universeId/scenes/:sceneId" element={<SceneDetail />} />
            <Route path="/scenes/:id" element={<SceneDetail />} />

            {/* Physics routes */}
            <Route path="/universes/:id/physics" element={<PhysicsPage />} />

            {/* Harmony routes */}
            <Route path="/universes/:id/harmony" element={<HarmonyPage />} />

            {/* Storyboard routes */}
            <Route path="/universes/:id/storyboards" element={<StoryboardList />} />
            <Route path="/storyboards/:id" element={<StoryboardDetail />} />
            <Route path="/storyboards/:id/edit" element={<StoryboardEditor />} />

            {/* User routes */}
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />

            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <GlobalModal />
          <NetworkErrorAlert />
        </div>
      </ConfigProvider>
    </Provider>
  );
};

export default App;
