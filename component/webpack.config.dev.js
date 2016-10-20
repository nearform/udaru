var webpack = require('webpack')
var autoprefixer = require('autoprefixer')
var path = require('path')

var plugins = [
  new webpack.DefinePlugin({
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }),
  new webpack.HotModuleReplacementPlugin()
]

module.exports = {
  entry: [
    'webpack-dev-server/client?http://localhost:3000',
    'webpack/hot/only-dev-server',
    path.join(__dirname, 'src/index.dev.jsx')
  ],

  module: {
    loaders: [{
      test: /\.jsx?$/,
      exclude: /node_modules/,
      loader: 'babel'
    }, {
      test: /\.scss$/,
      loader: 'style!css!postcss-loader!sass?outputStyle=expanded'
    }, {
      test: /\.css$/,
      loader: 'style-loader!css-loader!postcss-loader',
      exclude: [/node_modules/]
    }, {
      test: /\.jpg$/,
      loader: 'file-loader'
    }, {
      test: /\.png$/,
      loader: 'file-loader?name=images/[name].[ext]'
    }, {
      test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
      loader: 'url-loader?limit=10000&mimetype=application/font-woff'
    }, {
      test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
      loader: 'file-loader'
    }]
  },

  postcss: [
    autoprefixer({ browsers: ['last 2 versions'] })
  ],

  resolve: {
    extensions: ['', '.js', '.jsx']
  },

  devtool: 'source-map',

  output: {
    path: path.join(__dirname, 'dist'),
    publicPath: '/',
    filename: 'index.dev.js'
  },

  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    hot: true,
    historyApiFallback: true,
    host: '0.0.0.0',
    port: 3000
  },

  plugins: plugins
}
