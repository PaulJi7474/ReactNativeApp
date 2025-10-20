module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-worklets/plugin',
      'expo-router/babel',
      [
        'module-resolver',
        {
          root: ['./'],
          alias: { '@': './' },
          extensions: ['.tsx', '.ts', '.jsx', '.js', '.json']
        }
      ]
    ]
  };
};
