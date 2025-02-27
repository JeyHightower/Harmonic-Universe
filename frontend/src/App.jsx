import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConfigProvider, theme } from 'antd';
import store from './store';
import ModalProvider from './providers/ModalProvider';
import AppRoutes from './routes';
import Layout from './components/layout/Layout';
import './styles/global.css';

const App = () => {
  // Get system color scheme preference
  const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

  // Ant Design theme configuration
  const themeConfig = {
    algorithm: prefersDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
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
            <Layout>
              <AppRoutes />
            </Layout>
          </ModalProvider>
        </Router>
      </ConfigProvider>
    </Provider>
  );
};

export default App;
