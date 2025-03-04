import { ConfigProvider, theme } from 'antd';
import React, { lazy, Suspense, useEffect } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import {
  Route,
  HashRouter as Router,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { SettingOutlined, UserOutlined } from './components/common/Icons';
import Login from './components/features/auth/Login';
import ProfilePage from './components/features/auth/ProfilePage';
import Register from './components/features/auth/Register';
import Dashboard from './components/features/dashboard/Dashboard';
import NotFound from './components/features/errors/NotFound';
import HarmonyPage from './components/features/harmony/HarmonyPage';
import Home from './components/features/home/Home';
import PhysicsPage from './components/features/physics/PhysicsPage';
import SettingsPage from './components/features/settings/SettingsPage';
import UniverseDetail from './components/features/universe/UniverseDetail';
import UniverseEdit from './components/features/universe/UniverseEdit';
import VisualPage from './components/features/visual/VisualPage';
import Layout from './components/layout/Layout';
import { ROUTES } from './constants/routes';
import { ThemeProvider } from './contexts/ThemeContext';
import StoryboardDetail from './features/storyboard/StoryboardDetail';
import StoryboardEditor from './features/storyboard/StoryboardEditor';
import StoryboardList from './features/storyboard/StoryboardList';
import useModal from './hooks/useModal';
import ModalProvider from './providers/ModalProvider';
import ProtectedRoute from './routes/ProtectedRoute';
import store from './store';
import { checkAuthState } from './store/slices/authSlice';
import './styles/components.css';
import './styles/global.css';
import './styles/theme.css';
import { ModalRegistry } from './utils/modalRegistry';
import { handleModalRoute } from './utils/modalRouteHandler';
import { initializeTheme } from './utils/themeUtils';
import { API_CONFIG } from './utils/config';

// Lazy-loaded components
const UniverseList = lazy(() =>
  import('./components/features/universe/UniverseList')
);
const ModalExample = lazy(() => import('./components/examples/ModalExample'));
const IconTest = lazy(() => import('./components/IconTest'));
const PhysicsParametersModalTest = lazy(() =>
  import('./components/test/PhysicsParametersModalTest')
);
const ModalTest = lazy(() => import('./components/test/ModalTest'));
const StandaloneTest = lazy(() => import('./components/test/StandaloneTest'));
const ModalAccessibilityTest = lazy(() =>
  import('./components/test/ModalAccessibilityTest')
);
const ModalRouteTest = lazy(() => import('./components/test/ModalRouteTest'));

// Modal Route Handler Component
const ModalRouteHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { openModal } = useModal();

  useEffect(() => {
    // Check if the current path is an API modal route
    const path = location.pathname;

    if (path.startsWith(API_CONFIG.API_PREFIX)) {
      // Try to handle the route as a modal
      const handled = handleModalRoute(path, openModal);

      if (handled) {
        // If we successfully opened a modal, navigate back to the previous page
        // or to the home page if there's no history
        navigate(-1, { replace: true });
      }
    }
  }, [location, navigate, openModal]);

  return null;
};

// Test component to verify our icon solution
const IconTestComponent = () => {
  console.log('IconTest component rendering');
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
      <h2>Icon Test</h2>
      <p>
        UserOutlined: <UserOutlined />
      </p>
      <p>
        SettingOutlined: <SettingOutlined />
      </p>
    </div>
  );
};

const App = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, loading } = useSelector(state => state.auth);

  useEffect(() => {
    // Check authentication status when app loads
    console.log('App mounted, checking auth status');
    dispatch(checkAuthState());

    // Initialize theme
    initializeTheme();
  }, [dispatch]);

  // Get current theme from HTML attribute
  const isDarkMode =
    document.documentElement.getAttribute('data-theme') === 'dark';

  // Ant Design theme configuration
  const themeConfig = {
    algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: '#1890ff',
      borderRadius: 4,
      fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
                  'Helvetica Neue', Arial, 'Noto Sans', sans-serif`,
    },
    components: {
      Modal: {
        borderRadiusLG: 8,
        paddingContentHorizontalLG: 24,
      },
      Table: {
        borderRadiusLG: 8,
        padding: 16,
      },
      Card: {
        borderRadiusLG: 8,
        paddingLG: 24,
      },
      Button: {
        borderRadius: 4,
        paddingInline: 16,
      },
    },
  };

  // Handle API routes that should open in modals
  const handleApiRoutes = (location) => {
    const path = location.pathname;
    if (path.startsWith(API_CONFIG.API_PREFIX + '/')) {
      // Extract parameters from the path
      const pathParts = path.split('/');
      // ... existing code ...
    }
  };

  // Render loading state if authentication check is in progress
  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading application...</p>
      </div>
    );
  }

  return (
    <Provider store={store}>
      <ConfigProvider theme={themeConfig}>
        <Router>
          <ThemeProvider>
            <ModalProvider>
              <ModalRegistry />
              <ModalRouteHandler />
              <Suspense fallback={<div>Loading...</div>}>
                <Routes>
                  <Route path={ROUTES.HOME} element={<Layout />}>
                    <Route index element={<Home />} />
                    <Route path={ROUTES.LOGIN} element={<Login />} />
                    <Route path={ROUTES.REGISTER} element={<Register />} />
                    <Route
                      path={ROUTES.DASHBOARD}
                      element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      }
                    />
                    {/* Direct dashboard route for testing */}
                    <Route path="/direct-dashboard" element={<Dashboard />} />
                    <Route
                      path={ROUTES.UNIVERSES}
                      element={
                        <ProtectedRoute>
                          <UniverseList />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.UNIVERSE_DETAIL}
                      element={
                        <ProtectedRoute>
                          <UniverseDetail />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.UNIVERSE_EDIT}
                      element={
                        <ProtectedRoute>
                          <UniverseEdit />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path={ROUTES.MODAL_EXAMPLES}
                      element={<ModalExample />}
                    />
                    <Route
                      path={ROUTES.PROFILE}
                      element={
                        <ProtectedRoute>
                          <ProfilePage />
                        </ProtectedRoute>
                      }
                    />
                    <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
                    <Route path={ROUTES.ICON_TEST} element={<IconTest />} />
                    <Route
                      path={ROUTES.MODAL_TEST}
                      element={<PhysicsParametersModalTest />}
                    />
                    <Route
                      path={ROUTES.SIMPLE_MODAL_TEST}
                      element={<ModalTest />}
                    />
                    <Route
                      path={ROUTES.STANDALONE_TEST}
                      element={<StandaloneTest />}
                    />
                    <Route
                      path={ROUTES.MODAL_ACCESSIBILITY_TEST}
                      element={<ModalAccessibilityTest />}
                    />
                    <Route
                      path="/test/modal-routes"
                      element={<ModalRouteTest />}
                    />
                    <Route path={ROUTES.NOT_FOUND} element={<NotFound />} />
                    <Route
                      path="/universes/:universeId/storyboards"
                      element={
                        <ProtectedRoute>
                          <StoryboardList />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/universes/:universeId/storyboards/:storyboardId"
                      element={
                        <ProtectedRoute>
                          <StoryboardDetail />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/universes/:universeId/storyboards/:storyboardId/edit"
                      element={
                        <ProtectedRoute>
                          <StoryboardEditor />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/universes/:universeId/physics"
                      element={
                        <ProtectedRoute>
                          <PhysicsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/universes/:universeId/harmony"
                      element={
                        <ProtectedRoute>
                          <HarmonyPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/universes/:universeId/visual"
                      element={
                        <ProtectedRoute>
                          <VisualPage />
                        </ProtectedRoute>
                      }
                    />
                  </Route>
                </Routes>
              </Suspense>
            </ModalProvider>
          </ThemeProvider>
        </Router>
      </ConfigProvider>
    </Provider>
  );
};

export default App;
