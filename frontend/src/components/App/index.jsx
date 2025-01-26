import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import React from 'react';
import { Provider } from 'react-redux';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { store } from './store';
import { theme } from './theme';

// Components
import AnalyticsDashboard from './components/Analytics/AnalyticsDashboard';
import UniverseStats from './components/Analytics/UniverseStats';
import UserStats from './components/Analytics/UserStats';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import MainLayout from './components/layout/MainLayout';
import NotFound from './components/NotFound';
import PrivateRoute from './components/PrivateRoute';
import Profile from './components/Profile';
import UniverseCreate from './components/Universe/UniverseCreate';
import UniverseDetails from './components/Universe/UniverseDetails';
import UniverseList from './components/Universe/UniverseList';
import UniverseMusic from './components/Universe/UniverseMusic';
import UniversePhysics from './components/Universe/UniversePhysics';
import UniverseVisualization from './components/Universe/UniverseVisualization';

function App() {
    return (
        <Provider store={store}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <Router>
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        {/* Protected Routes */}
                        <Route element={<MainLayout />}>
                            <Route path="/" element={<Navigate to="/universes" replace />} />

                            <Route path="/universes" element={
                                <PrivateRoute>
                                    <UniverseList />
                                </PrivateRoute>
                            } />

                            <Route path="/universes/create" element={
                                <PrivateRoute>
                                    <UniverseCreate />
                                </PrivateRoute>
                            } />

                            <Route path="/universes/:id" element={
                                <PrivateRoute>
                                    <UniverseDetails />
                                </PrivateRoute>
                            } />

                            <Route path="/universes/:id/physics" element={
                                <PrivateRoute>
                                    <UniversePhysics />
                                </PrivateRoute>
                            } />

                            <Route path="/universes/:id/music" element={
                                <PrivateRoute>
                                    <UniverseMusic />
                                </PrivateRoute>
                            } />

                            <Route path="/universes/:id/visualization" element={
                                <PrivateRoute>
                                    <UniverseVisualization />
                                </PrivateRoute>
                            } />

                            <Route path="/analytics" element={
                                <PrivateRoute>
                                    <AnalyticsDashboard />
                                </PrivateRoute>
                            } />

                            <Route path="/analytics/universe/:id" element={
                                <PrivateRoute>
                                    <UniverseStats />
                                </PrivateRoute>
                            } />

                            <Route path="/analytics/user/:id" element={
                                <PrivateRoute>
                                    <UserStats />
                                </PrivateRoute>
                            } />

                            <Route path="/profile" element={
                                <PrivateRoute>
                                    <Profile />
                                </PrivateRoute>
                            } />
                        </Route>

                        {/* 404 Route */}
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </Router>
            </ThemeProvider>
        </Provider>
    );
}

export default App;
