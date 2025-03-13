import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store/store';
import Home from './features/Home.jsx';
import Dashboard from './features/Dashboard.jsx';
import GlobalModal from './components/GlobalModal.jsx';
import NetworkErrorAlert from './components/NetworkErrorAlert';

const App = () => {
  return (
    <Provider store={store}>
      <div className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
        <GlobalModal />
        <NetworkErrorAlert />
      </div>
    </Provider>
  );
};

export default App;
