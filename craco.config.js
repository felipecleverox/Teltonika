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
        ...webpackConfig.resolve.fallback,
        fs: require.resolve('browserify-fs'),
        path: require.resolve('path-browserify'),
        process: require.resolve('process/browser'),
        buffer: require.resolve('buffer/'),
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        vm: require.resolve('vm-browserify'), // Polyfill para vm
      };
      return webpackConfig;
    },
    plugins: [
      new webpack.ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer'],
      }),
    ],
  },
};

