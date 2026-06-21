const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  entry: './src/index.tsx',
  experiments: { outputModule: true },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    module: true,
    library: { type: 'module' },
    clean: false,
  },
  externalsType: 'module',
  externals: [
    // ST-Core-Module, die sillytavern-utils-lib per Relativpfad importiert,
    // NICHT bundlen -> loesen zur Laufzeit relativ zu dist/index.js auf.
    function ({ request }, callback) {
      if (request && /^\.\.\//.test(request) && request.endsWith('.js')) {
        return callback(null, 'module ' + request);
      }
      callback();
    },
  ],
  resolve: { extensions: ['.tsx', '.ts', '.jsx', '.js'] },
  module: {
    rules: [
      {
        test: /\.(ts|tsx|js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { targets: 'defaults', modules: false }],
              ['@babel/preset-react', { runtime: 'automatic' }],
              '@babel/preset-typescript',
            ],
          },
        },
      },
    ],
  },
  optimization: { minimizer: [new TerserPlugin()] },
};
