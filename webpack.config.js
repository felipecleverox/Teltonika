const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  entry: './src/index.js',
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/bitumix/'
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    alias: {
      'process': path.resolve(__dirname, 'node_modules/process'),
      'events': path.resolve(__dirname, 'node_modules/events'),
      'stream': path.resolve(__dirname, 'node_modules/stream-browserify'),
      'util': path.resolve(__dirname, 'node_modules/util'),
      'buffer': path.resolve(__dirname, 'node_modules/buffer'),
      'crypto': path.resolve(__dirname, 'node_modules/crypto-browserify'),
      'vm': path.resolve(__dirname, 'node_modules/vm-browserify')
    },
    symlinks: false,
    cacheWithContext: false,
    fallback: {
      "stream": require.resolve("stream-browserify"),
      "util": require.resolve("util/"),
      "buffer": require.resolve("buffer/"),
      "crypto": require.resolve("crypto-browserify"),
      "vm": require.resolve("vm-browserify"),
      "process": false
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html'
    }),
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser'
    }),
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(process.env)
    })
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist')
    },
    compress: true,
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: ['localhost', 'thenext.ddns.net', 'tnstrack.ddns.net'],
    historyApiFallback: {
      rewrites: [
        { from: /^\/$/, to: '/bitumix/' },
        { from: /^\/bitumix\//, to: '/bitumix/index.html' },
        { from: /./, to: '/bitumix/index.html' }
      ],
      index: '/bitumix/index.html'
    },
    proxy: [
      {
        context: ['/api1'],
        target: process.env.API_URL || 'http://localhost:1338',
        changeOrigin: true,
        secure: false,
      },
    ],
  }
};