const { defineConfig } = require('@vue/cli-service');
const webpack = require('webpack');

module.exports = defineConfig({
  transpileDependencies: true,
  configureWebpack: {
    plugins: [
      new webpack.DefinePlugin({
        '__VUE_OPTIONS_API__': true,
        '__VUE_PROD_DEVTOOLS__': false,
        '__VUE_PROD_HYDRATION_MISMATCH_DETAILS__': false
      }),
      // Provide polyfills for Node.js core modules
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        process: 'process/browser'
      })
    ],
    resolve: {
      fallback: {
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer/'),
        process: require.resolve('process/browser')
      }
    }
  },
  devServer: {  // Add this section for the proxy
    proxy: {
      '/static': {
        target: 'http://localhost:8000', // Your backend URL
        changeOrigin: true, // Required for CORS if needed
        // pathRewrite: {  // Optional: if your backend expects a different path
        //   '^/static': '' // Example: removes /static from the path sent to the backend
        // }
      },
    },
  },
});
