import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import copyReactFixesPlugin from './src/utils/vite-plugins/copy-react-fixes.mjs';

// Detect environment
const isProd = import.meta?.env?.PROD || process.env.NODE_ENV === 'production' || process.env.VITE_APP_ENV === 'production';
const isDebug = import.meta?.env?.DEBUG || process.env.DEBUG || process.env.VITE_VERBOSE;

// Split vendor plugin to ensure app and vendor code are separated
const splitVendorChunkPlugin = () => {
  return {
    name: 'split-vendor-chunk',
    enforce: 'post',
    generateBundle(_, bundle) {
      // This helps with optimal browser caching
    }
  };
};

// For the largest chunks, create an even more specific chunking strategy
const splitToneASN = (id) => {
  if (id.includes('node_modules/tone') && id.includes('asn')) {
    // Extract filename to create different chunks
    const fileName = id.split('/').pop();
    // Split by numeric patterns in filename to create multiple chunks
    if (/\d/.test(fileName)) {
      if (/[0-9][0-9][0-9]/.test(fileName)) {
        return 'vendor-tone-asn-300plus';
      }
      if (/[0-9][0-9]/.test(fileName)) {
        return 'vendor-tone-asn-100plus';
      }
      return 'vendor-tone-asn-numeric';
    }
    // Split alphabetically
    const firstChar = fileName.charAt(0).toLowerCase();
    if ('abcde'.includes(firstChar)) return 'vendor-tone-asn-a-e';
    if ('fghij'.includes(firstChar)) return 'vendor-tone-asn-f-j';
    if ('klmno'.includes(firstChar)) return 'vendor-tone-asn-k-o';
    if ('pqrst'.includes(firstChar)) return 'vendor-tone-asn-p-t';
    return 'vendor-tone-asn-u-z';
  }
  return null;
};

const splitToneES = (id) => {
  if (id.includes('node_modules/tone') && id.includes('/es/')) {
    // Extract the sub-module from the path
    const parts = id.split('/es/');
    if (parts.length > 1) {
      const subModule = parts[1].split('/')[0];
      if (subModule) {
        return `vendor-tone-es-${subModule}`;
      }
    }
    
    // Split by filename as fallback
    const fileName = id.split('/').pop().split('.')[0];
    if (fileName) {
      const firstChar = fileName.charAt(0).toLowerCase();
      if ('abcde'.includes(firstChar)) return 'vendor-tone-es-a-e';
      if ('fghij'.includes(firstChar)) return 'vendor-tone-es-f-j';
      if ('klmno'.includes(firstChar)) return 'vendor-tone-es-k-o';
      if ('pqrst'.includes(firstChar)) return 'vendor-tone-es-p-t';
      return 'vendor-tone-es-u-z';
    }
    
    return 'vendor-tone-es-core';
  }
  return null;
};

// Manual chunks function for better code splitting
const getManualChunks = (id) => {
  // First handle the largest problematic chunks with custom splitters
  const asnChunk = splitToneASN(id);
  if (asnChunk) return asnChunk;
  
  const esChunk = splitToneES(id);
  if (esChunk) return esChunk;
  
  // First categorize node_modules
  if (id.includes('node_modules')) {
    // React and related packages - split into smaller chunks
    if (id.includes('react')) {
      if (id.includes('react-dom')) {
        return 'vendor-react-dom';
      }
      if (id.includes('react-router')) {
        return 'vendor-react-router';
      }
      if (id.includes('react-redux')) {
        return 'vendor-react-redux';
      }
      return 'vendor-react-core';
    }
    
    if (id.includes('scheduler')) {
      return 'vendor-react-scheduler';
    }
    
    if (id.includes('prop-types')) {
      return 'vendor-react-props';
    }
    
    // Redux and related packages
    if (id.includes('redux-toolkit')) {
      return 'vendor-redux-toolkit';
    }
    if (id.includes('redux-persist')) {
      return 'vendor-redux-persist';
    }
    if (id.includes('redux')) {
      return 'vendor-redux-core';
    }
    
    // MUI components - split into smaller chunks
    if (id.includes('@mui/material')) {
      // Split MUI by component categories
      if (id.includes('/Button') || id.includes('/IconButton') || id.includes('/ButtonBase')) {
        return 'vendor-mui-buttons';
      }
      if (id.includes('/TextField') || id.includes('/Input') || id.includes('/FormControl')) {
        return 'vendor-mui-inputs';
      }
      if (id.includes('/Modal') || id.includes('/Dialog') || id.includes('/Drawer')) {
        return 'vendor-mui-dialogs';
      }
      if (id.includes('/Grid') || id.includes('/Container') || id.includes('/Box')) {
        return 'vendor-mui-layout';
      }
      if (id.includes('/Table')) {
        return 'vendor-mui-table';
      }
      if (id.includes('/List')) {
        return 'vendor-mui-list';
      }
      if (id.includes('/Card')) {
        return 'vendor-mui-card';
      }
      if (id.includes('/Menu') || id.includes('/Popover')) {
        return 'vendor-mui-menus';
      }
      return 'vendor-mui-core';
    }
    
    // MUI icons - split into categories to reduce chunk size
    if (id.includes('@mui/icons')) {
      if (id.includes('Action')) {
        return 'vendor-mui-icons-action';
      }
      if (id.includes('Navigation')) {
        return 'vendor-mui-icons-navigation';
      }
      if (id.includes('Editor')) {
        return 'vendor-mui-icons-editor';
      }
      if (id.includes('Content')) {
        return 'vendor-mui-icons-content';
      }
      return 'vendor-mui-icons-other';
    }
    
    if (id.includes('@emotion')) {
      if (id.includes('styled')) {
        return 'vendor-emotion-styled';
      }
      if (id.includes('react')) {
        return 'vendor-emotion-react';
      }
      return 'vendor-emotion-core';
    }
    
    // Three.js - split into core modules
    if (id.includes('three')) {
      if (id.includes('loaders')) {
        return 'vendor-three-loaders';
      }
      if (id.includes('controls')) {
        return 'vendor-three-controls';
      }
      if (id.includes('renderers')) {
        return 'vendor-three-renderers';
      }
      if (id.includes('math')) {
        return 'vendor-three-math';
      }
      if (id.includes('geometries')) {
        return 'vendor-three-geometries';
      }
      if (id.includes('materials')) {
        return 'vendor-three-materials';
      }
      return 'vendor-three-core';
    }
    
    // Tone.js - split into modules
    if (id.includes('tone')) {
      if (id.includes('component')) {
        return 'vendor-tone-components';
      }
      if (id.includes('effect')) {
        return 'vendor-tone-effects';
      }
      if (id.includes('instrument')) {
        return 'vendor-tone-instruments';
      }
      if (id.includes('event')) {
        return 'vendor-tone-events';
      }
      if (id.includes('signal')) {
        return 'vendor-tone-signal';
      }
      // Further split Tone.js core
      if (id.includes('core')) {
        return 'vendor-tone-core-base';
      }
      if (id.includes('source')) {
        return 'vendor-tone-source';
      }
      if (id.includes('player')) {
        return 'vendor-tone-player';
      }
      if (id.includes('transport')) {
        return 'vendor-tone-transport';
      }
      if (id.includes('audio')) {
        return 'vendor-tone-audio';
      }
      if (id.includes('analysis')) {
        return 'vendor-tone-analysis';
      }
      if (id.includes('channel')) {
        return 'vendor-tone-channel';
      }
      if (id.includes('clock')) {
        return 'vendor-tone-clock';
      }
      if (id.includes('context')) {
        return 'vendor-tone-context';
      }
      if (id.includes('filter')) {
        return 'vendor-tone-filter';
      }
      if (id.includes('param')) {
        return 'vendor-tone-param';
      }
      if (id.includes('synth')) {
        return 'vendor-tone-synth';
      }
      if (id.includes('type')) {
        return 'vendor-tone-type';
      }
      if (id.includes('util')) {
        return 'vendor-tone-util';
      }
      
      // Split by file path segments to create smaller chunks
      const segments = id.split('/');
      const lastSegment = segments[segments.length - 2] || ''; // Get the directory name
      if (lastSegment && lastSegment !== 'tone') {
        return `vendor-tone-${lastSegment}`;
      }
      
      // Last resort fallback - split alphabetically by filename
      const fileName = id.split('/').pop().split('.')[0];
      if (fileName) {
        const firstChar = fileName.charAt(0).toLowerCase();
        if ('abcde'.includes(firstChar)) return 'vendor-tone-core-a-e';
        if ('fghij'.includes(firstChar)) return 'vendor-tone-core-f-j';
        if ('klmno'.includes(firstChar)) return 'vendor-tone-core-k-o';
        if ('pqrst'.includes(firstChar)) return 'vendor-tone-core-p-t';
        return 'vendor-tone-core-u-z';
      }
      
      return 'vendor-tone-core';
    }
    
    // Other common libraries
    if (id.includes('axios')) {
      return 'vendor-axios';
    }
    if (id.includes('moment')) {
      return 'vendor-moment';
    }
    if (id.includes('antd')) {
      return 'vendor-antd';
    }
    if (id.includes('history')) {
      return 'vendor-history';
    }
    
    // Catch-all for remaining node_modules - split alphabetically
    const fileName = id.split('/').pop().split('.')[0];
    const firstChar = fileName.charAt(0).toLowerCase();
    
    if ('ab'.includes(firstChar)) return 'vendor-common-a-b';
    if ('cd'.includes(firstChar)) return 'vendor-common-c-d';
    if ('ef'.includes(firstChar)) return 'vendor-common-e-f';
    if ('gh'.includes(firstChar)) return 'vendor-common-g-h';
    if ('ijkl'.includes(firstChar)) return 'vendor-common-i-l';
    if ('mnop'.includes(firstChar)) return 'vendor-common-m-p';
    if ('qrs'.includes(firstChar)) return 'vendor-common-q-s';
    if ('tuvwxyz'.includes(firstChar)) return 'vendor-common-t-z';
    
    return 'vendor-common';
  }
  
  // Application code splitting - more granular
  if (id.includes('src')) {
    // Music feature components
    if (id.includes('/components/music')) {
      if (id.includes('Player')) {
        return 'app-music-player';
      }
      if (id.includes('Visualizer')) {
        return 'app-music-visualizer';
      }
      if (id.includes('Modal')) {
        return 'app-music-modal';
      }
      return 'app-music-components';
    }
    
    // Physics components
    if (id.includes('/components/physics')) {
      if (id.includes('Editor')) {
        return 'app-physics-editor';
      }
      if (id.includes('List')) {
        return 'app-physics-list';
      }
      if (id.includes('Parameters')) {
        return 'app-physics-parameters';
      }
      return 'app-physics-components';
    }
    
    // Scene components
    if (id.includes('/components/scenes')) {
      if (id.includes('List')) {
        return 'app-scenes-list';
      }
      if (id.includes('Detail')) {
        return 'app-scenes-detail';
      }
      if (id.includes('Edit')) {
        return 'app-scenes-edit';
      }
      if (id.includes('Form')) {
        return 'app-scenes-form';
      }
      return 'app-scenes-components';
    }
    
    // Character components
    if (id.includes('/components/characters')) {
      if (id.includes('List')) {
        return 'app-characters-list';
      }
      if (id.includes('Detail')) {
        return 'app-characters-detail';
      }
      if (id.includes('Form')) {
        return 'app-characters-form';
      }
      return 'app-characters-components';
    }
    
    // Notes components
    if (id.includes('/components/notes')) {
      return 'app-notes-components';
    }
    
    // Modal components
    if (id.includes('/components/modals')) {
      return 'app-modals';
    }
    
    // UI components
    if (id.includes('/components/ui/')) {
      return 'app-ui-components';
    }
    
    // Other components
    if (id.includes('/components/')) {
      return 'app-other-components';
    }
    
    // Store splitting
    if (id.includes('/store/slices')) {
      if (id.includes('auth')) {
        return 'app-redux-auth-slice';
      }
      if (id.includes('scene')) {
        return 'app-redux-scene-slice';
      }
      if (id.includes('character')) {
        return 'app-redux-character-slice';
      }
      if (id.includes('note')) {
        return 'app-redux-note-slice';
      }
      if (id.includes('physics') || id.includes('universe')) {
        return 'app-redux-physics-slice';
      }
      return 'app-redux-other-slices';
    }
    
    if (id.includes('/store/thunks')) {
      if (id.includes('auth')) {
        return 'app-redux-auth-thunks';
      }
      if (id.includes('scene')) {
        return 'app-redux-scene-thunks';
      }
      if (id.includes('character')) {
        return 'app-redux-character-thunks';
      }
      if (id.includes('note')) {
        return 'app-redux-note-thunks';
      }
      if (id.includes('physics') || id.includes('universe')) {
        return 'app-redux-physics-thunks';
      }
      return 'app-redux-other-thunks';
    }
    
    if (id.includes('/store/')) {
      return 'app-redux-core';
    }
    
    // Services and utilities
    if (id.includes('/services/')) {
      if (id.includes('api')) {
        return 'app-services-api';
      }
      if (id.includes('audio')) {
        return 'app-services-audio';
      }
      return 'app-services-other';
    }
    
    if (id.includes('/utils/')) {
      return 'app-utils';
    }
    
    // Pages and routes
    if (id.includes('/pages/')) {
      // One chunk per page to avoid large chunks
      if (id.includes('Home')) return 'app-page-home';
      if (id.includes('Login')) return 'app-page-login';
      if (id.includes('Register')) return 'app-page-register';
      if (id.includes('Scene')) return 'app-page-scenes';
      if (id.includes('Character')) return 'app-page-characters';
      if (id.includes('Note')) return 'app-page-notes';
      if (id.includes('Setting')) return 'app-page-settings';
      return 'app-pages-other';
    }
    
    if (id.includes('/routes/')) {
      return 'app-routes';
    }
    
    if (id.includes('/hooks/')) {
      return 'app-hooks';
    }
    
    if (id.includes('/constants/')) {
      return 'app-constants';
    }
    
    if (id.includes('/contexts/')) {
      return 'app-contexts';
    }
    
    // Any remaining src code
    return 'app-core';
  }
};

// Create build configuration based on environment
const getBuildConfig = () => {
  // Base build config for all environments
  const buildConfig = {
    outDir: 'dist',
    sourcemap: !isProd,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: ({ name }) => {
          if (/\.(gif|jpe?g|png|svg)$/.test(name ?? '')) {
            return 'images/[name].[hash][extname]';
          }

          if (/\.css$/.test(name ?? '')) {
            return 'styles/[name].[hash][extname]';
          }

          return 'assets/[name].[hash][extname]';
        },
        manualChunks: getManualChunks
      }
    }
  };

  // Only add terser options for production builds
  if (isProd) {
    buildConfig.minify = 'terser';
    buildConfig.terserOptions = {
      compress: {
        drop_console: !isDebug,
        drop_debugger: !isDebug,
        pure_funcs: isDebug ? [] : ['console.log', 'console.debug', 'console.info']
      },
      mangle: {
        safari10: true
      }
    };
  } else {
    buildConfig.minify = false;
  }

  return buildConfig;
};

// Export final config
export default defineConfig({
  plugins: [
    react(),
    copyReactFixesPlugin(),
  ],
  base: '/',
  root: path.resolve(__dirname),
  build: getBuildConfig(),

  define: {
    'process.env.NODE_ENV': JSON.stringify(isProd ? 'production' : 'development'),
    'process.env.VITE_APP_ENV': JSON.stringify(isProd ? 'production' : 'development')
  },

  resolve: {
    mainFields: ['browser', 'module', 'main'],
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Add alias for components for easier imports
      'components': path.resolve(__dirname, './src/components'),
      'features': path.resolve(__dirname, './src/features'),
      'store': path.resolve(__dirname, './src/store'),
      'utils': path.resolve(__dirname, './src/utils'),
      'services': path.resolve(__dirname, './src/services'),
      'hooks': path.resolve(__dirname, './src/hooks'),
      'contexts': path.resolve(__dirname, './src/contexts'),
      'assets': path.resolve(__dirname, './src/assets'),
      'styles': path.resolve(__dirname, './src/styles'),
      'constants': path.resolve(__dirname, './src/constants')
    },
    dedupe: ['react', 'react-dom', 'react-router-dom', '@reduxjs/toolkit', 'react-redux']
  },

  // Ensure Vite doesn't time out for slow connections
  server: {
    hmr: {
      timeout: 10000
    },
    port: 5173,
    open: false,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@reduxjs/toolkit',
      'react-redux'
    ],
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },

  // Enable JSX in .js files
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },

  // Enables more verbose logging if env var is set
  logLevel: isDebug ? 'info' : 'warn',
});
