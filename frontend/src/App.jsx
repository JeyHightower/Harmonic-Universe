import { ConfigProvider, theme } from 'antd';
import React, { lazy, Suspense, useEffect } from 'react';
import { Provider } from 'react-redux';
import { Route, HashRouter as Router, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ModalProvider from './providers/ModalProvider';
import { ROUTES } from './routes';
import ProtectedRoute from './routes/ProtectedRoute';
import store from './store';
import './styles/global.css';
import './styles/theme.css';
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
const IconTest = lazy(() => import('./components/test/IconTest'));
const PhysicsParametersModalTest = lazy(() =>
  import('./components/test/PhysicsParametersModalTest')
);
const ModalTest = lazy(() => import('./components/test/ModalTest'));
const StandaloneTest = lazy(() => import('./components/test/StandaloneTest'));

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
                </Route>

                {/* Standalone route outside of Layout */}
                <Route path="/standalone-test" element={<StandaloneTest />} />
              </Routes>
            </Suspense>
          </ModalProvider>
        </Router>
      </ConfigProvider>
    </Provider>
  );
};

export default App;
