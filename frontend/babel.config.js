module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Stable with Expo SDK 51; if you ever upgrade and it complains, swap to worklets plugin.
      'react-native-reanimated/plugin',
    ],
  };
};
