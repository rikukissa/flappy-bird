'use strict';

var path = require('path');
var webpack = require('webpack');
var extend = require('extend');

var production = process.env.NODE_ENV == 'production';

var entries = ['./scripts/index'];
var plugins = [
  require('webpack-notifier')
];


if(!production) {
  entries = [
    'webpack-dev-server/client?http://localhost:9000',
    'webpack/hot/only-dev-server'
  ].concat(entries);

  plugins = [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin()
  ].concat(plugins);
}


module.exports = {
  devtool: 'inline-source-map',
  entry: entries,
  output: {
    path: path.join(__dirname, 'build'),
    filename: 'bundle.js',
    publicPath: '/scripts/'
  },
  plugins: plugins,
  resolve: {
    extensions: ['', '.js', '.jsx']
  },
  module: {
    loaders: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loaders: ['monkey-hot', 'babel']
    }, {
      test: /\.css$/,
      loaders: ['style', 'css']
    }, {
      test: /\.styl$/,
      loaders: ['style', 'css', 'stylus']
    }
      // ,
      // {
      //   test: /\.(jpe?g|png|gif|svg)$/i,
      //   loaders: [
      //     'url?limit=800!image!image-maxsize?useImageMagick=true'
      //   ]
      // }
    ]
  }
};

