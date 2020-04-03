const PLUGIN_NAME = 'NunjucksTemplatePlugin';

const util = require('util');
const fs = require('fs');
const path = require('path');

const nunjucks = require('nunjucks');
const shell = require('shelljs');

const walkDir = require('./core/walkdir');
const pageHandler = require('./core/page-handler');
const sortPaths = require('./core/sort-paths');

class NunjucksTemplatePlugin {
  constructor(options) {
    this.options = options;
    this.templateEngine = new nunjucks.Environment(
      new nunjucks.FileSystemLoader(this.options.rootTemplatePath)
    )
  }

  apply(compiler) {

    this.options._pagesPath = path.resolve(process.cwd(), this.options.pagesTemplatePath);
    this.options._rootPath = path.resolve(process.cwd(), this.options.rootTemplatePath);

    compiler.hooks.done.tapAsync('MyPlugin', (stats) => {
      // Get Output Path
      let { compilation, ...rest } = stats;
      console.log(compilation.getAssets())
      const output = stats.compilation.outputOptions.path;

      // Get all Page Blob and sort
      const pagePaths = walkDir.call(this, this.options._pagesPath).sort(sortPaths);

      pagePaths.forEach(page => {
        pageHandler.call(this, page, output);
      });
    });
  }
}

module.exports = NunjucksTemplatePlugin;

/*
  new NunjucksTemplatePlugin({
    rootPath: './src/templates',
    pagesPath: './src/template/pages',
    renderDataPerPage: function(pagePath, callback) {
      const data = {};
      callback(data);
    }
  })
*/
