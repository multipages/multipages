const path = require('path');

const NunjucksTemplatePlugin = require('./plugins/NunjucksTemplatePlugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const sass = require('sass');

const data = require('./src/data');


module.exports = (argv, mode) => ({
  entry: ['./src/entry.js'],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: `scripts/[name].[hash:8].js`,
    publicPath: '/',
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
    new NunjucksTemplatePlugin({
      rootTemplatePath: './src/templates',
      pagesTemplatePath: './src/templates/pages',
      renderData: ({ slug }) => {
        try {
          return require(`./src/data${slug}`);
        } catch(err) {
          return require(`./src/data/`);
        }
      },
      slugs: {
        'produtos/@product': require('./src/data/produtos/@product'),
        'clientes/@client': require('./src/data/clientes/@client'),
      }
    })
  ]
});
