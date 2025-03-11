import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store/store';
import Home from './features/home/Home';
import Dashboard from './features/dashboard/Dashboard';
import GlobalModal from './components/common/GlobalModal';
import './App.css';

const App = () => {
  return (
    <Provider store={store}>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
          <GlobalModal />
        </div>
      </Router>
    </Provider>
  );
};

export default App;
