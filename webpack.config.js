const path = require('path');

// const NunjucksTemplatePlugin = require('./plugins/NunjucksTemplatePlugin');
const NunjucksTemplateWebpackPlugin = require('./plugins');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const sass = require('sass');

const merge = (...targets) => Object.assign({}, ...targets);

module.exports = (argv, mode) => ({
  entry: ['./src/entry.js'],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: `scripts/[name].[hash:8].js`,
    publicPath: '/',
  },
  watch: true,
  watchOptions: {
    aggregateTimeout: 300,
    poll: true
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            sourceMaps: true,
          },
        },
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          {
            loader: 'sass-loader',
            options: {
              implementation: sass,
              sourceMap: true,
            },
          },
        ],
      },
    ]
  },
  plugins: [
     new MiniCssExtractPlugin({
      filename: `styles/[name].[hash:8].css`,
      esModule: true,
    }),
    new NunjucksTemplateWebpackPlugin({
      rootTemplatePath: './src/templates',
      pagesTemplatePath: './src/templates/pages',
      minify: false,
      data({ route }) {
        let dataBase = require('./src/data');
        let dataRoute = {};

        try {
          dataRoute = require(`./src/data${route}`);
        } catch(err) {
          dataRoute = dataBase;
        }

        return dataRoute;
      }
    })
  ]
});
