module.exports = {
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.js',
    '!src/reportWebVitals.js',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testMatch: [
    '<rootDir>/tests/**/*.test.{js,jsx}',
    '<rootDir>/src/**/*.test.{js,jsx}',
  ],
  moduleDirectories: ['node_modules', 'src'],
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  verbose: true,
  testTimeout: 10000,
  globals: {
    __DEV__: true,
  },
};
