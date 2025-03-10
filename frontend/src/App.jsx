import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';

// Import safe providers
import { SafeRouter } from './utils/ensure-router-provider';
import { SafeReduxProvider } from './utils/ensure-redux-provider';

// Import our dynamic import utility
import './utils/dynamic-import';

// Use React.lazy for component imports instead of require()
const Layout = lazy(() => import('./components/Layout').catch(error => {
  console.error('Failed to import Layout component:', error);
  return {
    default: function LayoutFallback({ children }) {
      return React.createElement('div', { className: "layout-fallback" },
        React.createElement('header', { style: { padding: '1rem', background: '#f0f0f0' } }, "Header Fallback"),
        React.createElement('main', { style: { padding: '2rem' } }, children),
        React.createElement('footer', { style: { padding: '1rem', background: '#f0f0f0' } }, "Footer Fallback")
      );
    }
  };
}));

const Home = lazy(() => import('./features/home/Home').catch(error => {
  console.error('Failed to import Home page:', error);
  return {
    default: function HomeFallback() {
      return React.createElement('div', null, "Home Page Unavailable");
    }
  };
}));

// Dashboard with fallback
const Dashboard = lazy(() => import('./routes/Dashboard').catch(error => {
  console.error('Failed to load Dashboard:', error);
  return {
    default: function DashboardFallback() {
      return React.createElement('div', null, "Dashboard Unavailable");
    }
  };
}));

// Simple NotFound component
function NotFound() {
  return React.createElement('div', { className: "not-found" },
    React.createElement('h1', null, "404 - Page Not Found"),
    React.createElement('p', null, "The page you are looking for does not exist.")
  );
}

// Modal context provider - use ES6 import
import { ModalProvider } from './contexts/ModalContext';

// Fallback component for suspense
function LoadingFallback() {
  return React.createElement('div', {
    style: {
      padding: '20px',
      textAlign: 'center',
      margin: '20px 0'
    }
  },
    React.createElement('h2', null, "Loading..."),
    React.createElement('p', null, "Please wait while the content loads.")
  );
}

function App() {
  // Log application startup
  useEffect(() => {
    console.log('[App] Application initialized');

    // Log React versions
    console.log('[App] React version:', React.version);
    console.log('[App] ReactDOM available:', !!window.ReactDOM);

    // Add window error listeners
    const handleError = (event) => {
      console.error('[App] Global error caught:', event.error);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  return React.createElement(
    SafeRouter, null,
    React.createElement(
      SafeReduxProvider, null,
      React.createElement(
        ModalProvider, null,
        React.createElement(
          'div', { className: "app-container" },
          React.createElement(
            Routes, null,
            React.createElement(
              Route,
              {
                path: "/",
                element: React.createElement(
                  Suspense,
                  { fallback: React.createElement(LoadingFallback) },
                  React.createElement(Layout)
                )
              },
              React.createElement(
                Route,
                {
                  index: true,
                  element: React.createElement(
                    Suspense,
                    { fallback: React.createElement(LoadingFallback) },
                    React.createElement(Home)
                  )
                }
              ),
              React.createElement(
                Route,
                {
                  path: "dashboard",
                  element: React.createElement(
                    Suspense,
                    { fallback: React.createElement(LoadingFallback) },
                    React.createElement(Dashboard)
                  )
                }
              ),
              React.createElement(
                Route,
                {
                  path: "*",
                  element: React.createElement(NotFound)
                }
              )
            )
          )
        )
      )
    )
  );
}

// Also export component as named export
export { App };
export default App;
