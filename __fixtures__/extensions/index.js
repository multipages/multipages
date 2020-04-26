const nunjucks = require('nunjucks');

module.exports = class TemplateEngineNunjucksExtension {
  constructor(options) {
    this.options = {
      filters: [],
      extensions: [],
      ...options
    };

    this.ext = /\.(njk|nunjucks|html)$/g;
  }

  setup({ includePaths }) {
    this.loader = new nunjucks.FileSystemLoader(includePaths);
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
