// This file is a mock for react-refresh/babel
// It exports an empty function that will satisfy the import but not actually do anything

// Mock the babel transform function
function babelPlugin() {
  return {
    name: 'mock-react-refresh-babel',
    visitor: {
      // Empty visitor
    },
  };
}

module.exports = babelPlugin;
module.exports.default = babelPlugin;
