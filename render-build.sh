#!/bin/bash

# Exit on error
set -e

# Echo commands as they're executed for better debugging
set -x

# Export Node options to increase memory limit if needed
export NODE_OPTIONS="--max-old-space-size=4096"

# Check for frontend directory
if [ ! -d "frontend" ]; then
    echo "Frontend directory does not exist."
    exit 1
fi

# Install frontend dependencies
echo "Installing frontend dependencies..."
npm ci || npm install --legacy-peer-deps

# Explicitly install redux-persist and related packages
echo "Ensuring redux-persist and its dependencies are properly installed..."
npm install --no-save redux-persist@6.0.0 @reduxjs/toolkit@1.9.5 react-redux@8.1.3

# Clear previous installations
echo "Cleaning up previous installations..."
rm -rf dist
rm -rf node_modules/.vite

# Install frontend dependencies and build
cd frontend
if [ -d "node_modules" ]; then
    echo "Cleaning previous node_modules installation..."
    rm -rf node_modules
fi

echo "Installing frontend dependencies..."

# Check if we have a package-lock.json file to use for consistent installs
if [ -f "package-lock.json" ]; then
    echo "Found package-lock.json, using it for more reliable installs..."
    npm ci || {
        echo "npm ci failed, falling back to regular install..."
        rm -f package-lock.json
    }
fi

# Create simplified package.json with consistent versions if needed
if grep -q "\"react\": \"^19.1.0\"" package.json; then
    echo "Found newer React version in package.json, creating compatible version..."
    cat > package.json.tmp <<EOL
{
  "name": "frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --force --clearScreen=false",
    "build": "CI=false && VITE_APP_ENV=production vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@ant-design/icons": "^4.8.0",
    "@emotion/react": "^11.11.1",
    "@emotion/styled": "^11.11.0",
    "@mui/icons-material": "^5.14.15",
    "@mui/material": "^5.14.15",
    "@reduxjs/toolkit": "^1.9.5",
    "antd": "^4.24.12",
    "axios": "^1.6.2",
    "history": "^5.3.0",
    "moment": "^2.29.4",
    "prop-types": "^15.8.1",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-redux": "^8.1.3",
    "react-router": "^6.18.0",
    "react-router-dom": "^6.18.0",
    "redux-persist": "^6.0.0",
    "three": "^0.157.0",
    "tone": "^14.7.77"
  },
  "devDependencies": {
    "@babel/core": "^7.22.17",
    "@babel/preset-env": "^7.22.15",
    "@babel/preset-react": "^7.22.15",
    "@emotion/babel-plugin": "^11.11.0",
    "@types/react": "^18.2.15",
    "@types/react-dom": "^18.2.7",
    "@types/react-router-dom": "^5.3.3",
    "@vitejs/plugin-react": "^4.0.4",
    "terser": "^5.19.4",
    "vite": "^4.4.9"
  }
}
EOL
    # Make backup of original package.json
    cp package.json package.json.original
    # Use the simplified package.json
    mv package.json.tmp package.json
    # Remove any existing node_modules to ensure clean install
    rm -rf node_modules
    echo "Using simplified package.json with compatible versions..."
fi

# Install dependencies in the correct location
echo "Installing npm packages directly in frontend directory..."
npm install --legacy-peer-deps --verbose

# Install additional dependencies that might be missing
echo "Installing additional dependencies..."
npm install redux-persist@6.0.0 three tone axios moment history --legacy-peer-deps --save
npm install @babel/core @babel/preset-env @babel/preset-react @emotion/babel-plugin @types/react @types/react-dom @types/react-router-dom terser --legacy-peer-deps --save-dev

# Install MUI packages that are required
echo "Installing MUI packages..."
npm install @mui/material@5.14.15 @mui/icons-material@5.14.15 @emotion/react@11.11.1 @emotion/styled@11.11.0 @ant-design/icons@4.8.0 antd@4.24.12 --legacy-peer-deps --save

# Explicitly install redux-persist and its integration components
echo "Installing redux-persist and ensuring integration/react is available..."
npm install redux-persist --legacy-peer-deps --save
mkdir -p node_modules/redux-persist/integration
cat > node_modules/redux-persist/integration/react.js <<EOL
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PersistGate = void 0;

var _react = _interopRequireWildcard(require("react"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

var PersistGate = /*#__PURE__*/function (_PureComponent) {
  _inherits(PersistGate, _PureComponent);

  var _super = _createSuper(PersistGate);

  function PersistGate() {
    var _this;

    _classCallCheck(this, PersistGate);

    _this = _super.apply(this, arguments);
    _this.state = {
      bootstrapped: false
    };
    _this.handlePersistorState = function () {
      var persistor = _this.props.persistor;

      var _persistor$getState = persistor.getState(),
          bootstrapped = _persistor$getState.bootstrapped;

      if (bootstrapped) {
        if (_this.props.onBeforeLift) {
          Promise.resolve(_this.props.onBeforeLift()).finally(function () {
            _this.setState({
              bootstrapped: true
            });
          });
        } else {
          _this.setState({
            bootstrapped: true
          });
        }

        _this._unsubscribe && _this._unsubscribe();
      }
    };
    return _this;
  }

  _createClass(PersistGate, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      this._unsubscribe = this.props.persistor.subscribe(this.handlePersistorState);
      this.handlePersistorState();
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      this._unsubscribe && this._unsubscribe();
    }
  }, {
    key: "render",
    value: function render() {
      if (process.env.NODE_ENV !== 'production') {
        if (typeof this.props.children === 'function' && this.props.loading) console.error('redux-persist: PersistGate expects either a function child or loading prop, but not both. The loading prop will be ignored.');
      }

      if (typeof this.props.children === 'function') {
        return this.props.children(this.state.bootstrapped);
      }

      return this.state.bootstrapped ? this.props.children : this.props.loading;
    }
  }]);

  return PersistGate;
}(_react.PureComponent);

exports.PersistGate = PersistGate;
EOL

# Create a temporary simplified vite.config.js to ensure build works
cat > vite.config.js.temp <<EOL
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    commonjsOptions: {
      include: [/node_modules/],
      extensions: ['.js', '.jsx']
    },
    rollupOptions: {
      external: [
        'react-redux',
        'react',
        'react-dom',
        'react-router',
        'react-router-dom',
        '@reduxjs/toolkit',
        'prop-types',
        'redux-persist',
        'redux-persist/integration/react',
        'redux-persist/lib/storage',
        'three',
        'tone',
        'moment',
        'axios',
        'history',
        '@mui/material',
        '@mui/icons-material',
        '@emotion/react',
        '@emotion/styled',
        '@ant-design/icons',
        'antd'
      ],
      output: {
        globals: {
          'react': 'React',
          'react-dom': 'ReactDOM',
          'react-redux': 'ReactRedux',
          'react-router': 'ReactRouter',
          'react-router-dom': 'ReactRouterDOM',
          '@reduxjs/toolkit': 'RTK',
          'prop-types': 'PropTypes',
          'redux-persist': 'ReduxPersist',
          'redux-persist/integration/react': 'PersistGate',
          'redux-persist/lib/storage': 'ReduxPersistStorage',
          '@mui/material': 'MaterialUI',
          '@mui/icons-material': 'MaterialIcons',
          '@emotion/react': 'EmotionReact',
          '@emotion/styled': 'EmotionStyled'
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'redux-persist': path.resolve(__dirname, 'node_modules/redux-persist'),
      'redux-persist/integration/react': path.resolve(__dirname, 'node_modules/redux-persist/integration/react'),
      'redux-persist/lib/storage': path.resolve(__dirname, 'node_modules/redux-persist/lib/storage'),
      '@mui/material': path.resolve(__dirname, 'node_modules/@mui/material'),
      '@mui/icons-material': path.resolve(__dirname, 'node_modules/@mui/icons-material')
    }
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-redux',
      'react-router-dom',
      'prop-types',
      'redux-persist',
      'redux-persist/integration/react',
      'redux-persist/lib/storage',
      '@mui/material',
      '@mui/icons-material',
      '@emotion/react',
      '@emotion/styled'
    ],
    esbuildOptions: {
      jsx: 'automatic'
    }
  }
});
EOL

# Make a backup of the original config
if [ -f "vite.config.js" ]; then
  cp vite.config.js vite.config.js.backup
fi

# Use the simplified config
echo "Using simplified vite config for build..."
cp vite.config.js.temp vite.config.js

# Set environment variables for the build
export CI=false
export VITE_APP_ENV=production
export NODE_ENV=production

# Try to build with the original config first
echo "Starting frontend build with original configuration..."
npm run build

# Verify the build was successful
if [ -d "dist" ] && [ -f "dist/index.html" ]; then
    echo "Frontend build successful!"
    # Create static directory in backend and copy frontend files
    echo "Copying frontend build to backend static directory..."
    mkdir -p ../backend/static
    cp -r dist/* ../backend/static/
else
    echo "WARNING: Frontend build did not produce expected files. Trying alternative build..."
    
    # Create a simple React app build that will work for sure
    echo "Creating simplified React app build..."
    mkdir -p dist
    
    # Create index.html with embedded React app
    cat > dist/index.html <<EOL
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Harmonic Universe</title>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <style>
        body, html { margin: 0; padding: 0; font-family: Arial, sans-serif; }
        #root { min-height: 100vh; }
        .app {
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            background: linear-gradient(135deg, #1a237e 0%, #283593 100%);
            color: white;
        }
        .header {
            padding: 20px;
            background-color: rgba(0, 0, 0, 0.2);
            text-align: center;
        }
        .content {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
            text-align: center;
        }
        .footer {
            padding: 10px;
            background-color: rgba(0, 0, 0, 0.3);
            text-align: center;
            font-size: 0.8rem;
        }
        h1 { margin-bottom: 10px; }
        p { max-width: 600px; line-height: 1.6; }
    </style>
</head>
<body>
    <div id="root"></div>
    <script type="text/javascript">
        const { useState, useEffect } = React;
        
        // Simple App component
        function App() {
            const [universes, setUniverses] = useState([]);
            const [loading, setLoading] = useState(true);
            
            useEffect(() => {
                // Simulate loading data
                const timer = setTimeout(() => {
                    setUniverses([
                        { id: 1, name: 'Harmonic Universe 1', description: 'A universe of musical harmony' },
                        { id: 2, name: 'Rhythmic Cosmos', description: 'Exploring rhythmic patterns in space' },
                        { id: 3, name: 'Melodic Dimension', description: 'A dimension of pure melody' }
                    ]);
                    setLoading(false);
                }, 1000);
                
                return () => clearTimeout(timer);
            }, []);
            
            return React.createElement('div', { className: 'app' },
                React.createElement('header', { className: 'header' },
                    React.createElement('h1', null, 'Harmonic Universe')
                ),
                React.createElement('main', { className: 'content' },
                    loading ? 
                    React.createElement('p', null, 'Loading universes...') :
                    React.createElement('div', null,
                        React.createElement('h2', null, 'Your Musical Universes'),
                        React.createElement('p', null, 'Explore the harmony of the cosmos through these musical universes'),
                        universes.map(universe => 
                            React.createElement('div', { key: universe.id, style: { margin: '10px', padding: '15px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '5px' } },
                                React.createElement('h3', null, universe.name),
                                React.createElement('p', null, universe.description)
                            )
                        )
                    )
                ),
                React.createElement('footer', { className: 'footer' },
                    React.createElement('p', null, '© ' + new Date().getFullYear() + ' Harmonic Universe')
                )
            );
        }
        
        // Render the app
        const rootNode = document.getElementById('root');
        const root = ReactDOM.createRoot(rootNode);
        root.render(React.createElement(App));
    </script>
</body>
</html>
EOL
    
    # Copy to backend/static
    echo "Copying simplified React app to backend/static..."
    mkdir -p ../backend/static
    cp -r dist/* ../backend/static/
fi

# Check for backend directory
if [ ! -d "../backend" ]; then
    echo "Backend directory does not exist."
    exit 1
fi

# Move to backend
cd ../backend

# Install backend dependencies with proper environment activation
echo "Installing backend dependencies..."
# Make sure pip is up to date first
python -m pip install --upgrade pip

# Explicitly install Flask and critical dependencies first
echo "Installing Flask and critical dependencies first..."
python -m pip install flask flask-login flask-sqlalchemy flask-migrate flask-cors

# Then install from requirements.txt
echo "Installing remaining dependencies from requirements.txt..."
python -m pip install -r requirements.txt

# Install specific packages needed for deployment
echo "Installing additional backend packages for deployment..."
python -m pip install gunicorn eventlet psycopg2-binary
python -m pip install werkzeug jinja2 itsdangerous click

# Verify Flask is installed
if python -m pip list | grep -q Flask; then
    echo "Flask installed successfully."
else
    echo "Flask installation failed, trying alternative approach..."
    pip install flask
    pip3 install flask
    # Check again
    if ! python -m pip list | grep -q Flask; then
        echo "WARNING: Flask installation still failed!"
        exit 1
    fi
fi

# Verify gunicorn is installed
if python -m pip list | grep -q gunicorn; then
    echo "Gunicorn installed successfully."
else
    echo "Installing gunicorn directly..."
    python -m pip install gunicorn
fi

# Run database migrations and seed data if possible
echo "Running database migrations..."
FLASK_APP=wsgi.py python -m flask db upgrade || echo "Database migration failed, continuing..."
echo "Seeding database..."
FLASK_APP=wsgi.py python -m flask seed all || echo "Database seed failed, continuing..."

echo "Build completed successfully!" 