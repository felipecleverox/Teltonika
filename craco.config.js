const webpack = require('webpack');

module.exports = {
  devServer: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: 'all',
  },
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.resolve.fallback = {
        fs: false,
        path: require.resolve('path-browserify'),
        buffer: require.resolve('buffer/'),
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        util: require.resolve('util/'),
        assert: require.resolve('assert/'),
        vm: require.resolve('vm-browserify'),
        process: require.resolve('process/browser'), // Add the process polyfill
      };

      webpackConfig.plugins.unshift(
        new webpack.ProvidePlugin({
          process: 'process/browser', // Provide the polyfill globally
          Buffer: ['buffer', 'Buffer'],
        })
      );

      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        'readable-stream': 'readable-stream/readable-browser.js',
        'stream': 'stream-browserify/index.js', // Explicitly point to browser entry
      };

      return webpackConfig;
    },
  },
};
