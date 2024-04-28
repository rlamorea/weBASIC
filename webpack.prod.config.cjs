const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    webasic: './scripts/index.js'
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './webasic.html',
      filename: 'index.html'
    }),
    new MonacoWebpackPlugin()
  ],
  module: {
    rules: [
      { test: /\.s[ac]ss$/i,
        use: [ 'style-loader', 'css-loader', 'sass-loader' ]
      }
    ]
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    clean: true
  }
}
