const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

module.exports = {
  mode: 'development',
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
      },
      { test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      { test: /\.ttf$/,
        type: 'asset/resource'
      }
    ]
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    clean: true
  },
  devtool: 'source-map',
  devServer: {
    static: {
      directory: path.resolve(__dirname, 'dist'),
    },
    server: 'http', // 'https'
    port: 6510,
    host: 'localhost',
    hot: true,
    open: true
  }
}
