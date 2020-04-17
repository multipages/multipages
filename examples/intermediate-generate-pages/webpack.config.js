const path = require('path');

// const NunjucksTemplatePlugin = require('./plugins/NunjucksTemplatePlugin');
const MultiPagePlugin = require('./plugins');
const NunjucksTemplateExtension = require('./plugins/extensions/TemplateEngineNunjucksExtension');
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
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
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
    new MultiPagePlugin({
      rootTemplatePath: './src/templates',
      pagesTemplatePath: './src/templates/pages',
      templateEngine: new NunjucksTemplateExtension({
        filters: [],
        extensions: []
      }),
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
