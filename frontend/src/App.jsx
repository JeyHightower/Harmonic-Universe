// App.jsx
import React from 'react';
import { Provider } from 'react-redux';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import UniverseEditor from './components/Universe/UniverseEditor';
import store from './redux/store';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="app">
          <Routes>
            <Route
              path="/universes/:universeId/edit"
              element={<UniverseEditor />}
            />
            {/* Add more routes here */}
          </Routes>
        </div>
      </Router>
    </Provider>
  );
}

export default App;
