class Core {
  constructor(paths, engine, middleware) {
    this.paths = paths;
    this.engine = engine;
    this.middleware = middleware;

    this.state = {
      sourceList: []
    };

    this.cache = {
      output: new Set();
    }

    this.setup();
  }

  setup() {
    this.paths.setup();
    this.engine.setup();
    this.middleware.setup();
  }

  async function start() {
    await this.paths.erase(); // erase output pages
    await this.paths.fetch(); // fetch list from pages path
    await this.paths.generate(); // generate all pages path
    await this.paths.cache(); // cache output pages
    await this.engine.compile(); // compile all pages -> path + dataSource
    await this.middlewares.run(); // execute all middlewares -> template + dataSource
    await this.paths.render(); // render all pages at output path
  }
}
