const path = require('path');

const nunjucks = require('nunjucks');

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
      ...options
    };

    this.setup();
  }

  apply(compiler) {
    // When compilation is done
    compiler.hooks.done.tapAsync(PLUGIN_NAME, stats => this.start(stats));
  }

  setup() {
    this.resolvePathsFromObject(process.cwd(), this.options, [
      'rootTemplatePath',
      'pagesTemplatePath'
    ]);

    this.setupTemplateEngine();
    this.setupTemplateFilters();
    this.setupTemplateExtensions();
  }

  start({ compilation }) {
    this.setupCompilation(compilation);

    this.pageList = this.getPageList();
    this.pageListSorted = this.pageList.sort(sortPagePath);
    this.pageDataList = this.getDataList();
    this.pageRenderedList = this.getRenderedList();

    const output = this.getOutputOptionsFromCompilation().path;

    this.pageRenderedList.map(pageRendered => {
      const dirname = path.resolve(`${output}${pageRendered.dirname}`);
      const filename = path.resolve(`${output}${pageRendered.filename}`);

      removeFile(filename)
      createDir(dirname);
      createFile(filename, pageRendered.template)
    });

  }

  getDataList() {
    return this.pageListSorted.map(page => {
      const { dirname, filename } = page;

      return {
        filename,
        dirname,
        dataList: this.options.data({ route: dirname })
      };
    });
  }

  getRenderedList() {
    return this.pageDataList.map((pageData) => {
      return pageData.dataList.map(data => {
        const { slug } = data;

        const template = this.templateEngine.render(`${this.options.pagesTemplatePath}${pageData.filename}`, data);
        const dirname = pageData.dirname.replace(/@\w+/, slug);
        const filename = pageData.filename.replace(/@\w+(?=\/)/, slug).replace(/\.njk$/, '.html');

        return {
          slug,
          template,
          dirname: dirname.replace(/@\w+/, slug),
          filename: filename.replace(/@\w+(?=\/)/, slug).replace(/\.njk$/, '.html'),
        }
      });
    }).flat(Infinity);
  }

  hasParam(route) {
    return route.includes('@');
  }

  getData() {
    return (typeof resource === 'function') ? resource(page) : resource;
  }

  resolvePathsFromObject(base, source, pathNameList) {
    pathNameList.forEach(pathName => {
      source[pathName] = source[pathName] ? path.resolve(base, source[pathName]) : source[pathName]
    });
  }

  getOutputOptionsFromCompilation() {
    return this.compilation.outputOptions;
  }

  getAssetsFromCompilation() {
    return this.compilation.getAssets();
  }

  getPageList() {
    return walkDir(this.options.pagesTemplatePath);
  }

  setupCompilation(compilation) {
    this.compilation = compilation;
  }

  setupTemplateEngine() {
    this.templateEngine = new nunjucks.Environment(new nunjucks.FileSystemLoader(this.options.rootTemplatePath));
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
