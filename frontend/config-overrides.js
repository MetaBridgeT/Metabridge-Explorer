module.exports = function override(config, env) {
  let loaders = config.resolve;
  loaders.fallback = {
    path: require.resolve("path-browserify"),
    fs: require.resolve("browserify-fs"),
    buffer: require.resolve('buffer/'),
    stream: require.resolve("stream-browserify"),
    util: require.resolve("util/")
  };

  return config;
};
