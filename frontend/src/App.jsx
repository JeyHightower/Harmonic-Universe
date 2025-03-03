import { SettingOutlined, UserOutlined } from '@ant-design/icons';
import { ConfigProvider, theme } from 'antd';
import React, { lazy, Suspense, useEffect } from 'react';
import { Provider } from 'react-redux';
import {
  Route,
  HashRouter as Router,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import Layout from './components/layout/Layout';
import { ROUTES } from './constants/routes';
import { useModal } from './contexts/ModalContext';
import ModalProvider from './providers/ModalProvider';
import ProtectedRoute from './routes/ProtectedRoute';
import store from './store';
import './styles/global.css';
import './styles/theme.css';
import { ModalRegistry } from './utils/modalRegistry';
import { handleModalRoute } from './utils/modalRouteHandler';
import { initializeTheme } from './utils/themeUtils';

// Lazy-loaded components
const Home = lazy(() => import('./components/features/home/Home'));
const Login = lazy(() => import('./components/features/auth/Login'));
const Register = lazy(() => import('./components/features/auth/Register'));
const Dashboard = lazy(() =>
  import('./components/features/dashboard/Dashboard')
);
const UniverseList = lazy(() =>
  import('./components/features/universe/UniverseList')
);
const UniverseDetail = lazy(() =>
  import('./components/features/universe/UniverseDetail')
);
const UniverseEdit = lazy(() =>
  import('./components/features/universe/UniverseEdit')
);
const ModalExample = lazy(() => import('./components/examples/ModalExample'));
const SettingsPage = lazy(() =>
  import('./components/features/settings/SettingsPage')
);
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
const Profile = lazy(() => import('./components/features/auth/ProfilePage'));
const NotFound = lazy(() => import('./components/features/errors/NotFound'));

// Modal Route Handler Component
const ModalRouteHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { openModalByType } = useModal();

  useEffect(() => {
    // Check if the current path is an API modal route
    const path = location.pathname;

    if (path.startsWith('/api/')) {
      // Try to handle the route as a modal
      const handled = handleModalRoute(path, openModalByType);

      if (handled) {
        // If we successfully opened a modal, navigate back to the previous page
        // or to the home page if there's no history
        navigate(-1, { replace: true });
      }
    }
  }, [location, navigate, openModalByType]);

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
  // Initialize theme on app load
  useEffect(() => {
    initializeTheme();
  }, []);

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

  return (
    <Provider store={store}>
      <ConfigProvider theme={themeConfig}>
        <Router>
          <ModalProvider>
            <ModalRegistry />
            <ModalRouteHandler />
            <Suspense fallback={<div>Loading...</div>}>
              <Routes>
                <Route element={<Layout />}>
                  <Route path={ROUTES.HOME} element={<Home />} />
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
                        <Profile />
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
                </Route>
              </Routes>
            </Suspense>
          </ModalProvider>
        </Router>
      </ConfigProvider>
    </Provider>
  );
};

export default App;
