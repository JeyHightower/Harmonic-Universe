// vite.config.cjs - CommonJS version
module.exports = {
    // Use "/" for production deployment
    base: '/',

    // Simple React configuration
    plugins: [],

    // Build configuration
    build: {
        outDir: 'dist',
        assetsDir: '',
        sourcemap: true
    },

    // Basic environment variables
    define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
        'global': 'window'
    }
};
