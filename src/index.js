const fs = require('fs');
const path = require('path');

const shell = require('shelljs');
const { minify: minifier } = require('html-minifier-terser');

const { sortPagePath } = require('./core');
const { createFile, createDir, removeFile } = require('./utils');

const PLUGIN_NAME = 'MultiPagePlugin';

class MultiPagePlugin {
  constructor(options = {}) {
    this.options = {
      rootTemplatePath: './src',
      pagesTemplatePath: './src',
      templateEngine: function() {},
      data: {},
      ...options
    };
  }

  apply(compiler) {
    // Called after setting up initial set of internal plugins
    compiler.hooks.afterPlugins.tap(PLUGIN_NAME, compiler => {
      removeFile(compiler.outputPath);
    });

    // When compilation is done
    compiler.hooks.done.tapAsync(PLUGIN_NAME, (stats, callback) => {
      this.setup(stats);
      this.start();

      callback();
    });
  }

  walkDir(dirPath) {
    const paths = [];

    const walk = (directory) => {
      const files = fs.readdirSync(directory);

      files.forEach(file => {
        const filePath = path.resolve(directory, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          return walk(filePath);
        }

        if (this.templateEngine.reExtensions.test(path.extname(filePath))) {
          const relativePath = filePath.replace(dirPath, '');
          const splitedPath = relativePath.split('\\');

          const [name] = splitedPath[splitedPath.length - 1].split(/\./);
          const dirname = splitedPath.slice(0, splitedPath.length - 1).join('/');
          const filename = relativePath.replace(/\\/g, '/');

          return paths.push({
            filename,
            name,
            dirname: dirname ? dirname : '/',
            ext: path.extname(filePath)
          });
        }
      });
    };

    walk(dirPath);

    return paths;
  }

  extractAssets() {
    const assetsData = this.compilation.getAssets();
    const assets = {};

    assetsData.forEach(asset => {
      const [, type] = asset.name.match(/\.(\w+)$/);
      assets[type] = asset.name;
    });

    return assets;
  }

  setup({ compilation }) {
    this.compilation = compilation;
    this.outputPath = compilation.outputOptions.path;
    this.rootPagesRender = this.options.pagesTemplatePath.replace(`${this.options.rootTemplatePath}/`, '')
    this.templateEngine = this.options.templateEngine.setup(path.resolve(process.cwd(), this.options.rootTemplatePath));

    this.watchPages = this.walkDir(this.options.rootTemplatePath);
    this.watchPages
      .forEach(({ filename }) => compilation.fileDependencies.add(path.resolve(filename)));
  }

  resolveOutputPath(pathname) {
    return path.resolve(`${this.outputPath}${pathname}`);
  }

  resolveTemplateName(dirname, ext) {
    return `${this.rootPagesRender}${dirname === '/' ? '' : dirname }/index${ext}`;
  }

  getPages() {
    const output = this.outputPath;

    const pages = this.fileListSorted.map(({ dirname, filename, ext }) => {
      const pageData = this.options.data({ route: dirname });
      const assets = this.extractAssets();

      if (Array.isArray(pageData)) {
        return pageData.map(({ params, data }) => {
          let template = filename;
          let dirPath = dirname;

          Object.keys(params).forEach(paramId => {
            template = template.replace(paramId, params[paramId]);
            dirPath = dirPath.replace(paramId, params[paramId]);
          });

          return {
            dirname: this.resolveOutputPath(dirPath),
            filename: this.resolveOutputPath(template),
            template: this.resolveTemplateName(dirname, ext),
            data: {...data, assets },
          };
        });
      }

      return {
        filename: this.resolveOutputPath(filename),
        dirname: this.resolveOutputPath(dirname),
        template: this.resolveTemplateName(dirname, ext),
        data: { ...pageData.data, assets },
      };
    })

    // to make a simple vector
    return pages.flat(Infinity);
  }

  clearOutputPaths() {
    if (this.outputPageCache) {
      this.outputPageCache.forEach(({ dirname, filename }) => {
        removeFile(dirname.replace(this.outputPath, '') === '' ? filename : dirname);
      });
    }

    this.outputPageCache = [...this.pages];
  }

  start() {
    this.fileList = this.walkDir(
      path.resolve(process.cwd(), this.options.pagesTemplatePath)
    );

    this.fileListSorted = [...this.fileList].sort(sortPagePath);

    this.pages = this.getPages();

    this.clearOutputPaths();

    this.pages.map(({ dirname, filename, template, data }) => {
      let compiledTemplate = this.templateEngine.render(template, data);
      let target = dirname.replace(this.outputPath, '') === '/' ? filename : dirname;

      compiledTemplate = this.minify(compiledTemplate);

      createDir(dirname);
      createFile(filename.replace(this.templateEngine.reExtensions, '.html'), compiledTemplate);
    });
  }

  minify(template) {
    return this.options.minify
      ? minifier(template, {
          // https://www.npmjs.com/package/html-minifier-terser#options-quick-reference
          collapseWhitespace: true,
          keepClosingSlash: true,
          removeComments: true,
          removeRedundantAttributes: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true,
          useShortDoctype: true
        })
      : template;
  }
}



module.exports = MultiPagePlugin;
