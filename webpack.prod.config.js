const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    webasic: './scripts/index.js'
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './webasic.html',
      filename: 'index.html'
    })
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
