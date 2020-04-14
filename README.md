<h1 align="center">
  <img src="logo.jpg" alt="Multipages" />
</h1>

> **Multipages is a static site generator** in form of webpack plugin that use your favorite  template engine and generate multiple pages and subpages

## Highlights

- :tada: Easy to generate static sites
- :electric_plug: Use your Favorite Template Engine
- :trophy: Each Page can have it own data file
- :microscope: Your can minify the HTML output
- :fire: You Can add custom assets to the template

## Basic Usage

#### Install

```
  yarn add webpack @multipages/plugin @multipages/nunjucks-extension
```

#### Setup

Add the MultiPages plugin into the webpack plugins array within `webpack.config.js` file

```javascript
const MultiPagesPlugin = require('@multipages/plugin');
const MultiPagesNunjucksExtension = require('@multipages/nunjucks-extension')

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
    new MultiPagesPlugin({
      rootTemplatePath: './src/templates',
      pagesTemplatePath: './src/templates/pages',
      templateEngine: new MultiPagesNunjucksExtension({
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

#### Options

| Name              | Type       | Default  | Description                                                                              |
| ----------------- | ---------- | -------- | ---------------------------------------------------------------------------------------- |
| rootTemplatePath  | `String`   | './src'  | Where all yours includes, partials, components, pages live                               |
| pagesTemplatePath | `String`   | './src'  | Where all your structure pages live                                                      |
| data              | `Function` | `Object` | The `data` function thats receive the current route and expect to returns an object `{}` |
| minify            | `Boolean`  | `false`  | Compile a minify version of HTML                                                         |

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

The Multipages Plugin will request the correspondent **data** file from the interface of plugin,
in there you can require it and return, then, the plugin will throughout the array of datas
and generate all `@product` pages, see below the result and then an example of **data** file.

:red_circle: Look the `@` at the beginning in product folder, that's necessary to MultiPages create the routes and generate final folders

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
