<h1 align="center">
  <img src="logo.jpg" alt="Multipages" />
</h1>

<p align="center">
  <!-- <a href="https://discord.gg/ZegqCBr"><img src="https://img.shields.io/discord/612704110008991783" alt="discord"></!-->
  <!-- <a href="https://travis-ci.org/standard/standard"><img src="https://img.shields.io/travis/standard/standard/master.svg" alt="travis"></a> -->
  <!-- <a href="https://www.npmjs.com/package/standard"><img src="https://img.shields.io/npm/v/standard.svg" alt="npm version"></a> -->
  <!-- <a href="https://www.npmjs.com/package/eslint-config-standard"><img src="https://img.shields.io/npm/dm/eslint-config-standard.svg" alt="npm downloads"></a> -->
  <a href="https://standardjs.com"><img src="https://img.shields.io/badge/code_style-standard-brightgreen.svg" alt="Standard - JavaScript Style Guide"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="licenses - MIT"></a>
</p>

> **MultiPages is a static site generator** in the form of webpack plugin that uses your favorite template engine and generates multiple pages and subpages - :construction: Project Under Construction :construction:

# Highlights

- :tada: Easy to generate **static sites**
- :electric_plug: Use your favorite **Template Engine**
- :trophy: Each page can have it own **data file**
- :microscope: You can **minify** the HTML output
- :fire: You can add **custom assets** to the template

# Basic Usage

#### Install

```
  yarn add webpack @multipages/plugin @multipages/nunjucks-extension
```

#### Setup

Add the MultiPages Plugin into the webpack plugins array within `webpack.config.js` file.

```javascript
const MultiPagesPlugin = require('@multipages/plugin');
const MultiPagesNunjucksExtension = require('@multipages/nunjucks-extension');

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

#### Packages

| Name       | package                          | Status           |
| ---------- | -------------------------------- | ---------------- |
| multipages | @multipages/plugin               | Build Pass Bagde |
| nunjucks   | @multipages/nunjucks-extension   | Build Pass Bagde |
| pug        | @multipages/pug-extension        | Build Pass Bagde |
| ejs        | @multipages/ejs-extension        | Build Pass Bagde |
| handlebars | @multipages/handlebars-extension | Build Pass Bagde |

#### Options

| Name              | Type                      | Default                 | Description                                                                         |
| ----------------- | ------------------------- | ----------------------- | ----------------------------------------------------------------------------------- |
| rootTemplatePath  | `String`                  | './src/templates'       | Where all yours includes, partials, components, pages live                          |
| pagesTemplatePath | `String`                  | './src/templates/pages' | Where all your structured pages live                                                |
| templateEngine    | `TemplateEngineExtension` | `Object`                | Inform which template engine extension you prefer use                               |
| data              | `Function`                | `Object`                | The `data` function receives the current route and expects to return an object `{}` |
| minify            | `Boolean`                 | `false`                 | Compile a minify version of HTML                                                    |

## Common Page Generate

This simple pages structure will generate the same pages in the output path:

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

Look the output pages below:

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

You can return a specific **data file** per route. The MultiPages Plugin expects a **data function** that receives each processed route, then, expects to return a correspondent **data object**. Let's see an example below:

```javascript
/**
 * Example of path pages
 *
 * Route    | Path                         |
 * ---------|------------------------------|
 * /        | ./src/data/index.js          |
 * /contact | ./src/data/contact/index.js  |
*/

module.exports = {
  data: {
    title: 'Contact Page',
    description: 'Please feel free to contact me',
    tracking: {
      UA: 'XXXXX'
    }
  }
};
```

_Example plugin interface:_

```javascript
/**
 * just a piece of code to explain data request
*/

new MultiPagesPlugin({
  data({ route }) {
    return require(`./src/data${route}`);
  }
});
```

## Intermediate Page Generate

Let's move forward and be more complex, here we gonna generate multiple `product` pages.

Now our data file has to exports a list of objects, each object must have 2 properties, the `params` and `data`.

We need to assign the corresponding value to the params, so, MultiPages can generate all folders correctly.


_Example data file:_

```javascript
/**
 * This data file has a specific path to make easy your request
 *
 * path: ./src/data/products/@product
*/

module.exports = [
  {
    params: {
      "@product": "smartphone"
    },
    data: {
      title: 'Smartphone Page'
    }
  },
  {
    params: {
      "@product": "calculator"
    },
    data: {
      title: 'Calculator Page'
    }
  },
  {
    params: {
      "@product": "computer"
    },
    data: {
      title: 'Computer Page'
    }
  },
];
```

The pages structure must be different too, to informs MultiPage that `product` template will be replicated through the data list (from data file), we need to prefix the `product` folder with "@" character, like this: `@product`.

_Example source pages structure_

```
templates
`-- pages
    |-- index.njk
    `-- products
        |-- @product
        |   `-- index.njk
        `-- index.njk
```
_Example output pages structure:_

```
dist
|-- index.html
`-- products
    |-- smartphone
    |   `-- index.html
    |-- calculator
    |   `-- index.html
    |-- computer
    |   `-- index.html
    `-- index.html
```
## Advanced Page Generate

Let's see a more complex route, this time with 3 levels:

_Example source pages structure_

```
templates
`-- pages
    |-- index.njk
    `-- products
        |-- @category
        |   |-- @subcategory
        |   |   |-- @productId
        |   |   |   `-- index.njk
        |   |   `-- index.njk
        |   `-- index.njk
        `-- index.njk
```

_Example data file level 1:_

```javascript
/**
 * Level 1
 * Route  |  /products/@category
 * Data   |  ./src/data/products/@category/index.js
*/

module.exports = [
  {
    params: {
      "@category": "technology"
    },
    data: {
      title: "technology"
    }
  },
  {
    params: {
      "@category": "food"
    },
    data: {
      title: "food"
    }
  },
  {
    params: {
      "@category": "costume"
    },
    data: {
      title: "costume"
    }
  }
]
```
_Example data file level 2:_

```javascript
/**
 * Level 2
 * Route  |  /products/@category/@subcategory
 * Data   |  ./src/data/products/@category/@subcategory/index.js
*/

module.exports = [
  {
    params: {
      "@category": "technology",
      "@subcategory": "computer",
    },
    data: {
      title: "technology - computer"
    }
  },
  {
    params: {
      "@category": "food"
      "@subcategory": "italian",
    },
    data: {
      title: "food - italian"
    }
  },
  {
    params: {
      "@category": "costume"
      "@subcategory": "beach",
    },
    data: {
      title: "costume - beach"
    }
  }
]
```

_Example data file level 3:_

```javascript
/**
 * Level 3
 * Route  |  /products/@category/@subcategory/@productId
 * Data   |  ./src/data/products/@category/@subcategory/@productId/index.js
*/

module.exports = [
  {
    params: {
      "@category": "technology",
      "@subcategory": "computer",
      "@productId": "motherboard",
    },
    data: {
      title: "technology - computer - motherboard"
    }
  },
  {
    params: {
      "@category": "technology",
      "@subcategory": "computer",
      "@productId": "videoboard",
    },
    data: {
      title: "technology - computer - videoboard"
    }
  },
  {
    params: {
      "@category": "food"
      "@subcategory": "italian",
      "@productId": "videoboard",
    },
    data: {
      title: "food - italian - videoboard"
    }
  },
  {
    params: {
      "@category": "costume"
      "@subcategory": "beach",
      "@productId": "swimming-trunks",
    },
    data: {
      title: "costume - beach - swimming-trunks"
    }
  }
]
```

_Example output pages structure:_

```
dist
|-- index.html
`-- products
    |-- technology
    |   |-- index.html
    |   `-- computer
    |       |-- index.html
    |       |-- motherboard
    |       |   `-- index.html
    |       `-- videoboard
    |           `-- index.html
    |-- food
    |   |-- index.html
    |   `-- italian
    |       |-- index.html
    |       `-- pizza
    |           `-- index.html
    |-- costume
    |   |-- index.html
    |   `-- beach
    |       |-- index.html
    |       `-- swimming-trunks
    |           `-- index.html
    `-- index.html
```

## Assets

As MultiPage works together with the webpack, it gets access to the `assets` that have been processed through an object called assets within data object that the templates have access.

_Example use the assets:_

```html
<!DOCTYPE html>
<html lang="en">
  <head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Example MultiPage Template</title>

  <!-- Here we add a link to style-->
  <link href="{{ assets.css }}" type="text/css">
  </head>
  <body>
    <div id="app"></div>

    <!-- Here we add a script -->
    <script src="{{ assets.js }}"></script>
  </body>
</html>
```

# Maintainers

<table>
  <tbody>
    <tr>
      <td align="center">
        <img width="150" height="150"
        src="https://avatars2.githubusercontent.com/u/4645658?s=460&u=72ded9dd7cf1d6bfae41ed541fc349ca76d42d95&v=4">
        </br>
        <a href="https://github.com/simaodeveloper">Daniel Simão</a>
      </td>
    </tr>
  <tbody>
</table>

# Contributors

This project exists thanks to all the people who contribute.

You're free to contribute to this project by submitting [issues](https://github.com/multipages/multipages/issues) and/or [pull requests](https://github.com/multipages/multipages/pulls). This project is test-driven, so keep in mind that every change and new feature should be covered by tests.

This repository uses [standard style guide](https://github.com/standard/standard)

# License

MIT © Daniel Simão da Silva


