module.exports = class Engine {
  constructor(includesPath, engine) {
    this.engine = engine;

    this.setup({
      includesPath
    });
  }

  setup(options) {
    if (this.engine) {
      this.engine.setup(options)
      this.ext = this.engine.ext;
    }
  }

  compile(template, data) {
    if (this.engine) {
      return this.engine.compile(template, data);
    }

    return template;
  }
}
