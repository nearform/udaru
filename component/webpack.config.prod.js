var webpack = require('webpack')
var autoprefixer = require('autoprefixer')
var path = require('path')

var plugins = [
  new webpack.DefinePlugin({
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }),
  new webpack.optimize.UglifyJsPlugin({
    compress: {
      warnings: false
    }
  })
]

module.exports = {
  entry: path.join(__dirname, 'src/index.jsx'),

  module: {
    loaders: [{
      test: /\.jsx?$/,
      exclude: /node_modules/,
      loader: 'babel'
    }, {
      test: /\.scss$/,
      loader: 'style!css!postcss-loader!sass'
    }, {
      test: /\.css$/,
      loader: 'style-loader!css-loader!postcss-loader'
    }, {
      test: /\.jpg$/,
      loader: 'file-loader'
    }, {
      test: /\.png$/,
      loader: 'file-loader?name=images/[name].[ext]'
    }]
  },

  postcss: [
    autoprefixer({ browsers: ['last 2 versions'] })
  ],

  resolve: {
    extensions: ['', '.js', '.jsx']
  },

  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'index.js',
    libraryTarget: 'umd',
    library: 'FullstackBoilerplate'
  },

  externals: {
    'react': 'react',
    'react-dom': 'react-dom'
  },

  plugins: plugins
}
