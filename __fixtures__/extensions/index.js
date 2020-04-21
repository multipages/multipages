const nunjucks = require('nunjucks');

module.exports = class TemplateEngineNunjucksExtension {
  constructor(options) {
    this.options = {
      filters: [],
      extensions: [],
      ...options
    };

    this.reExtensions = /\.(njk|nunjucks|html)$/g;
  }

  setup(rootPath) {
    this.loader = new nunjucks.FileSystemLoader(rootPath);
    this.engine = new nunjucks.Environment(this.loader);

    this.options.filters.forEach((...options) => this.addFilter(...options));
    this.options.extensions.forEach((...options) => this.addExtension(...options));

    return this;
  }

  addFilter(...options) {
    this.engine.addFilter(...options);
  }

  addExtensions(...options) {
    this.engine.addExtension(...options);
  }

  compile(filename, data) {
    return this.engine.render(filename, data);
  }
}
