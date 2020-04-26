const { resolve } = require('path');
const { existsSync, rmdirSync, unlinkSync } = require('fs');
const { stat, readFile, readdir, writeFile, mkdir } = require('fs').promises;

const { JSDOM: Parser } = require('jsdom');

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
    this.settings = settings;
    this.pagesPath = resolve(process.cwd(), settings.pagesPath);
    this.output = resolve(process.cwd(), settings.output);
    this.data = data;
    this.hooks = hooks;
    this.engine = engine;
    this.middlewares = middlewares;

    // state
    this.sourceFiles = [];

    // hooks
    this.hooks.on('fetchPagesPathHook', () => {});
    this.hooks.on('injectDataSourceHook', () => {});
    this.hooks.on('pagesRenderedHook', () => {});

    // engine
    this.engine.setup({
      includesPath: settings.includesPath
    });
  }

  async generatePagesPath() {
    this.pagesPathList = await Page.fetchPagesPath(this.pagesPath);
    this.hooks.emit('fetchPagesPathHook', this.pagesPathList);
  }

  async generatePages() {
    this.pages = this.pagesPathList.map(async (pagePath) => {
      const page = new Page(this.pagesPath, pagePath);
      const route = page.extractRoute();
      const dataSources = await this.data.fetch(route);

      return Page.extractPagesFromSource(dataSources, page);
    });

    this.pages = await Promise.all(this.pages);

    this.pages = this.pages.flat(Infinity);

    this.pages = [...this.pages.sort(sortByDescRoute)];
  }

  async compile() {

    try {
      await stat(this.output);
    } catch(err) {
      await mkdir(this.output, {
        encoding: 'utf8'
      });
    }

    const renderedPages = this.pages.map(async (page) => {
      const compiled = this.engine.compile(await page.fetchTemplate(), page.dataSource);

      const parsed = new Parser(compiled);

      this.middlewares.execute({ parsed, dataSource: page.dataSource });

      const serialized = parsed.serialize();

      return await this.render(serialized, page);
    });

    this.hooks.emit('pagesRenderedHook', await Promise.all(renderedPages));
  }

  async injectAssets() {
    await this.data.inject(this.pages, ({ path, dataSource }) =>
      this.hooks.emit('injectDataSourceHook', { path, dataSource })
    );
  }

  async render(template, page) {
    const dir = resolve(`${this.output}${page.path}`);
    const output = resolve(dir, 'index.html');

    if (page.extractRoute() !== '/' && !existsSync(dir)) {
      try {
        await mkdir(dir, {
          encoding: 'utf8'
        });
      } catch(err) {
        console.log(err);
      }
    }

    try {
      await writeFile(output, template, {
        encoding: 'utf8',
        flag: 'w+'
      });
    } catch(err) {
      console.log(err);
    }

    return { dir, output, path: page.path };
  }

  async execute() {
    await this.generatePagesPath();
    await this.generatePages();
    await this.injectAssets();
    await this.compile();
  }

}
