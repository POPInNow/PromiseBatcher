/* global __dirname, require, module, process */

const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const path = require('path');
const pkg = require('./package.json');

const libraryName = 'promisebatcher';
const mode = process.env.NODE_ENV;
const plugins = [];
let outputFile;

if (mode === 'production') {
  plugins.push(new UglifyJsPlugin({
    test: /\.js($|\?)/i,
    cache: true,
    parallel: true,
    sourceMap: true,
    uglifyOptions: {
      mangle: true,
      compress: true
    }
  }));
  outputFile = libraryName + '.min.js';
} else {
  outputFile = libraryName + '.js';
}

const config = {
  mode: mode || 'none',
  entry: './src/promise-batcher.js',
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: outputFile,
    library: 'PromiseBatcher',
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  module: {
    rules: [
      {
        test: /(\.jsx|\.js)$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['env']
          }
        }
      }
    ]
  },
  resolve: {
    modules: [path.resolve('./node_modules'), path.resolve('./src')],
    extensions: ['.js']
  },
  plugins: plugins,
  externals: {
    promise: {
      commonjs: 'promise',
      commonjs2: 'promise',
      amd: 'promise',
      root: 'Promise'
    }
  }
};

module.exports = config;
