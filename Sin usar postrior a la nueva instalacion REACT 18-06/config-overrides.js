// config-overrides.js
module.exports = function override(config, env) {
    if (env === 'development') {
      config.devServer = config.devServer || {};
      config.devServer.disableHostCheck = true;
    }
    return config;
  };
  