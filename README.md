<h1 align="center">
  <img src="logo.jpg" alt="Multipage" />
</h1>

> **Multipage is a static site generator** in form of webpack plugin that use your prefered template engine and generate multiple pages and subpages

## Highlights

- :tada: Easy to generate static sites
- :electric_plug: Use your Favorite Template Engine
- :trophy: Each Page can have it own data file
- :microscope: Your can minify the HTML output
- :fire: You Can add custom assets to the template

## Basic Usage

#### Install

```
  yarn add webpack @multipage/plugin @multipage/nunjucks-extension
```

#### Setup

Add the MultiPage plugin into the webpack plugins array within `webpack.config.js` file

```javascript
const MultiPagePlugin = require('@multipage/plugin');
const MultiPageNunjucksExtension = require('@multipage/nunjucks-extension')

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
  plugins: [
    new MultiPagePlugin({
      rootTemplatePath: './src/templates',
      pagesTemplatePath: './src/templates/pages',
      templateEngine: new MultiPageNunjucksExtension({
        filters: [],
        extensions: []
      }),
      minify: true,
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
};
```
#### Common Page Generate

These simple pages structure will generate basically the same pages in output path:

```
templates
`-- pages
    |-- index.njk
    |-- contact
    |   `-- index.njk
    |-- about
    |   `-- index.njk
    `-- portfolio
        `-- index.njk
```

See below the output pages:

```
dist
|-- index.html
|-- contact
|   `-- index.html
|-- about
|   `-- index.html
`-- portfolio
    `-- index.html
```

#### Intermediate Page Generate

Now we are looking for generate multiple `product` pages based on Array from correspondent **data** file

```
templates
`-- pages
    |-- index.njk
    `-- products
        |-- @product
        |   `-- index.njk
        `-- index.njk
```

The Multipage Plugin will request the correspondent **data** file from the interface of plugin,
in there you can require it and return, then, the plugin will throughout the array of datas
and generate all `@product` pages, see below the result and then a example of **data** file.

> Look the `@` at the beginning in product folder, that's necessary to MultiPage create the routes and generate final folders

```
dist
|-- index.html
`-- products
    |-- smartphone
    |   `-- index.html
    |-- calculator
    |   `-- index.njk
    |-- computer
    |   `-- index.njk
    `-- index.html
```
