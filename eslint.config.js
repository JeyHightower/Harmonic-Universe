import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import imports from 'eslint-plugin-import';

export default [
  // Ignore patterns
  { ignores: ['dist', 'node_modules', 'build', '*.d.ts', 'backend/static'] },
  
  // Base JS rules
  js.configs.recommended,
  
  // React config
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        // Audio globals
        AudioWorkletGlobalScope: 'readonly',
      },
      parserOptions: {
        ecmaFeatures: { jsx: true }
      }
    },
    settings: { 
      react: { version: 'detect' },
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx']
        },
        alias: {
          map: [
            ['@', './frontend/src']
          ],
          extensions: ['.js', '.jsx']
        }
      }
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      import: imports
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      
      // Disable rules that are causing many errors
      'react/jsx-no-target-blank': 'off',
      'react/prop-types': 'warn', 
      'react/display-name': 'warn',
      'react/no-unescaped-entities': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      'no-unused-vars': ['warn', {
        varsIgnorePattern: 'React|^_',
        argsIgnorePattern: '^_',
      }],
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'import/no-unresolved': 'error',
      'import/named': 'error',
      'import/default': 'error',
      'import/namespace': 'error',
      'import/order': ['warn', {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'never'
      }]
    }
  }
]; 