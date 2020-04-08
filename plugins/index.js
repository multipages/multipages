const fs = require('fs');
const path = require('path');

const shell = require('shelljs');
const nunjucks = require('nunjucks');
const minifier = require('html-minifier-terser').minify;

const { walkDir, sortPagePath } = require('./core');
const { createFile, createDir, removeFile } = require('./utils');

const PLUGIN_NAME = 'NunjucksTemplateWebpackPlugin';

module.exports = class NunjucksTemplateWebpackPlugin {
  constructor(options = {}) {
    this.options = {
      rootTemplatePath: './src',
      pagesTemplatePath: './src',
      templateFilters: [],
      templateExtensions: [],
      data: {},
      re: {
        templateExt: /\.(njk|nunjucks|html)$/g
      },
      ...options
    };
  }

  apply(compiler) {
    // When compilation is done
    compiler.hooks.done.tapAsync(PLUGIN_NAME, stats => {
      this.setup(stats);
      this.start();
    });
  }

  setupRootPagesRender() {
    this.options.rootPagesRender = this.options.pagesTemplatePath.replace(`${this.options.rootTemplatePath}/`, '')
  }

  setupAssets() {
    const assetsData = this.getAssetsFromCompilation();
    const assets = {};

    assetsData.forEach(asset => {
      const [, type] = asset.name.match(/\.(\w+)$/);
      assets[type] = asset.name;
    });

    this.assets = assets;
  }

  setup({ compilation }) {
    this.setupRootPagesRender();
    this.setupCompilation(compilation);
    this.setupAssets();
    this.setupTemplateEngine();
    this.setupTemplateFilters();
    this.setupTemplateExtensions();
  }

  getPages() {
    return this.fileListSorted.map(page => {
      const { dirname, filename, ext } = page;

      let pageData = this.options.data({ route: dirname });

      if (Array.isArray(pageData)) {
        return pageData.map(({ params, data }) => {
          let template = filename;
          let dirPath = dirname;

          Object.keys(params).forEach(paramId => {
            template = template.replace(paramId, params[paramId]);
            dirPath = dirPath.replace(paramId, params[paramId]);
          });

          return {
            data: {...data, assets: this.assets },
            ext,
            route: dirname,
            dirname: dirPath,
            filename: template,
          };
        });
      } else {
        return {
          filename,
          dirname,
          ext,
          route: dirname,
          data: { ...pageData.data, assets: this.assets }
        }
      }
    }).flat(Infinity);
  }

  start() {
    const output = this.getOutputOptionsFromCompilation().path;

    this.fileList = this.getFileList();
    this.fileListSorted = this.fileList.sort(sortPagePath);

    this.pages = this.getPages();

    this.pages.map(page => {
      const dirname = path.resolve(`${output}${page.dirname}`);
      const filename = path.resolve(`${output}${page.filename.replace(this.options.re.templateExt, '.html')}`);
      let template = this.templateEngine.render(`${this.options.rootPagesRender}${page.route === '/' ? '' : page.route }/index${page.ext}`, page.data);

      if (this.options.minify) {
        template = minifier(template, {
          // https://www.npmjs.com/package/html-minifier-terser#options-quick-reference
          collapseWhitespace: true,
          keepClosingSlash: true,
          removeComments: true,
          removeRedundantAttributes: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true,
          useShortDoctype: true
        });
      }

      let target = page.dirname === '/' ? filename : dirname;

      removeFile(target);
      createDir(dirname);
      createFile(filename, template);
    });

  }

  hasParam(route) {
    return route.includes('@');
  }

  getOutputOptionsFromCompilation() {
    return this.compilation.outputOptions;
  }

  getAssetsFromCompilation() {
    return this.compilation.getAssets();
  }

  getFileList() {
    return walkDir(
      path.resolve(process.cwd(), this.options.pagesTemplatePath)
    );
  }

  setupCompilation(compilation) {
    this.compilation = compilation;
  }

  setupTemplateEngine() {
    this.templateEngine = new nunjucks.Environment(new nunjucks.FileSystemLoader(
      path.resolve(process.cwd(), this.options.rootTemplatePath)
    ));
  }

  setupTemplateFilters() {
    this.options.templateFilters.length && this.options.templateFilters
      .forEach(({ name, method, async }) => this.templateEngine.addFilter(name, method, async));
  }

  setupTemplateExtensions() {
    this.options.templateExtensions.length && this.options.templateExtensions
      .forEach(({ name, ext }) => this.templateEngine.addExtension(name, ext));
  }
}
