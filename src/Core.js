const { resolve } = require('path');
const { stat, readFile, readdir } = require('fs').promises;

const Page = require('./Page');

const sortByDescRoute = (a, b) => {
  const aSize = a.extractRoute().split('/').length
  const bSize = b.extractRoute().split('/').length;

  return (aSize > bSize) ? 1 : (aSize < bSize) ? -1 : 0;
}

module.exports = class Core {
  constructor({
    settings,
    data,
    hooks,
    engine,
    middlewares
  }) {
    // dependêncies
    this.pagesPath = resolve(process.cwd(), settings.pagesPath);
    this.output = resolve(process.cwd(), settings.output);
    this.data = data;
    this.hooks = hooks;
    this.engine = engine;
    this.middlewares = middlewares;

    // state
    this.sourceFiles = [];

    // hooks
    this.hooks.on('fetchPagesPath', () => {});
    this.hooks.on('injectDataSourceHook', () => {});
  }

  async generatePagesPath() {
    this.pagesPathList = await Page.fetchPagesPath(this.pagesPath);

    this.hooks.emit('fetchPagesPathHook', pagesPath);
  }

  async generatePages() {
    this.pages = this.pagesPathList.map(async (pagePath) => {
      const page = new Page(this.pagesPath, pagePath);
      const route = page.extractRoute();
      const dataSourceCollection = await this.data.fetch(route);

      await this.data.inject(dataSourceCollection, dataSource => {
        this.hooks.emit('injectDataSourceHook', { route, dataSource });
      });

      return Page.extractPagesFromSource(dataSourceCollection, page);
    });
  }

  async resolvePagesPromises() {
    this.pages = await Promise.all(this.pages);
  }

  async flattenPages() {
    this.pages = this.pages.flat(Infinity);
  }

  async orderPagesByRoute() {
    this.pages = [...this.pages.sort(sortByDescRoute)];
  }

  async execute() {
    await this.generatePagesPath();
    await this.generatePages();
    await this.resolvePagesPromises();
    await this.flattenPages()
    await this.orderPagesByRoute();

    // compile and render
    pageList.forEach(page => {

    });

  }

}
