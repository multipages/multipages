const { readdirSync, statSync, existsSync } = require('fs');
const { writeFile, rmdir, unlink } = require('fs').promises;
const { resolve, normalize } = require('path');
const { rm, mkdir } = require('shelljs');
const { JSDOM: Parse } = require('jsdom');

const resolvePath = (pathfile, context) => resolve(context !== undefined ? context : process.cwd(), pathfile);

const defaultSettings = {
  rootPath: './src/templates',
  pagesPath: './src/templates/pages',
  output: './dist',
  engine: null,
  middlewares: [],
  paramSymbol: '@',
  async data() {
    return {
      params: {},
      data: {}
    };
  },
};

const EVENTS = {
  FILE_PATHS_CREATED: 'filePathsCreated',
  ERROR: 'error'
};

const MESSAGES = {
  NOT_ENGINE: 'Please attach a template engine extension at plugin!'
};

const orderByLength = (pathA, pathB) => {
  // To order routes from root to more complex
  const a = pathA.split('/').length + pathA.length;
  const b = pathB.split('/').length + pathB.length;

  return (a > b) ? 1 : (a < b) ? -1 : 0;
}

class Core {
  constructor({ settings, hooks }) {
    // Set Dependencies
    this.hooks = hooks;

    this.settings = {
      ...defaultSettings,
      ...settings
    };

    // Fix Paths
    this.settings.rootPath = resolvePath(this.settings.rootPath);
    this.settings.pagesPath = resolvePath(this.settings.pagesPath);
    this.settings.output = resolvePath(this.settings.output);

    // Define Hooks
    this.hooks.on(EVENTS.FILE_PATHS_CREATED, () => {});
    this.hooks.on(EVENTS.ERROR, () => {});

    // Set cache for rebuild
    this.cache = {
      output: new Set()
    };
  }

  createRoutePattern() {
    return new RegExp(`(?:${this.settings.paramSymbol})`, 'g');
  }

  createFilePathList(targetPath, ext = /(\.html)$/) {
    const paths = [];

    const walk = (directory) => {
      const files = readdirSync(directory);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let filePath = resolvePath(file, directory);

        if (statSync(filePath).isDirectory()) {
          walk(filePath);
          continue;
        }

        filePath = filePath
          .replace(this.settings.pagesPath, '')
          .replace(/\\/g, '/');

        ext.test(filePath) && paths.push(filePath);
      }
    };

    walk(targetPath
      ? resolvePath(targetPath)
      : resolvePath(this.settings.pagesPath)
    );

    this.hooks.emit('filePathsCreated', paths);

    return paths;
  }

  createRouterList(filePaths) {
    const paths = filePaths || this.createFilePathList();
    const routerList = paths
      .map(path => {
        let routeSplit = path.split('/');

        // remove filename and extension
        let route = routeSplit.slice(0, routeSplit.length - 1).join('/');

        // fix root and return route and file
        return {
          route: (route) ? route : '/',
          file: routeSplit[routeSplit.length - 1]
        };
      })
      .sort((rA, rB) => orderByLength(rA.route, rB.route));

    console.log(routerList);

    return routerList;
  }

  dataHandler(route) {
    return this.settings.data(route);
  }

  async routeHandler({ route, file }) {
    const hasParam = this.createRoutePattern().test(route);
    const dataSource = await this.dataHandler(route);
    const dataSourceList = hasParam && Array.isArray(dataSource) ? dataSource : [dataSource];

    return dataSourceList.map(source => this.dataSourceHandler(route, file, source));
  }

  dataSourceHandler(route, file, sourceItem) {
    const sourceDefault = { params: {}, data: {} };
    const { params, data } = Object.assign({}, sourceDefault, sourceItem);
    const page = this.createPathByParams(route, params);

    return { data, route, page, file };
  }

  createPathByParams(route, params) {
    let pagename = route;

    Object.keys(params).forEach(id => pagename = pagename.replace(id, params[id]));

    return pagename;
  }


  /**
   * @method createPageList
   * @description generate a list of info of all pages with data, route, page (final path)
   * @param {Array} routeList
   */
  async createPageList(routerList) {
    const router = routerList || this.createRouterList();

    let pages = router.map(options => this.routeHandler(options));

    // Resolve all promises
    pages = await Promise.all(pages)

    // Flattening all pages
    return pages.flat(Infinity);
  }

  executeMiddleWares(context) {
    const middlewares = [...this.settings.middlewares];
    const length = middlewares.length;
    let counter = 0;

    const next = () => (counter < length)
      ? middlewares[counter++](context, next)
      : context;

    return next() || context;
  }

  async clearOutput() {

    const finishedProcess = Array.from(this.cache.output).sort(orderByLength).reverse().map(template => {
      if (existsSync(template)) {
        return statSync(template).isDirectory()
          ? rmdir(template, { recursive: true })
          : unlink(template);
      }
    });

    return await Promise.all(finishedProcess);
  }

  async run() {
    if (!this.settings.engine) {
      this.hooks.emit('error', new Error(MESSAGES.NOT_ENGINE));
      return false;
    }

    this.engine = this.settings.engine.setup(this.settings.rootPath);

    const filePathList = this.createFilePathList(this.settings.pagesPath, this.engine.ext);
    const routerList = this.createRouterList(filePathList);
    const pages = await this.createPageList(routerList);

    await this.clearOutput();

    let pagesPathList = pages.map((options) => this.handlePage(options));

    return Promise.all(pagesPathList);
  }

  handlePage({ data, route, page, file }) {
    const path = `${route}/${file}`;
    const template = resolvePath(`${this.settings.pagesPath}${normalize(path)}`);
    const compiled = this.engine.compile(template, data);

    // parse html
    const parsedDOM = new Parse(compiled);

    // run middleware
    const context = this.executeMiddleWares({ parsedDOM, data });

    // serialized processed html
    const serialized = context.parsedDOM.serialize();

    // render serialized
    return this.render(serialized, page);
  }

  render(htmlString, page) {
    const isRoot = () => page === '/';

    if (this.createRoutePattern().test(page)) {
      return this.hooks.emit(EVENTS.ERROR, new Error(`The page ${page} don't have params defined!`));
    }

    const dirname = resolvePath(`${this.settings.output}${normalize(page)}`, '');
    const filename = resolvePath('index.html', dirname);

    isRoot() && existsSync(this.settings.output) && mkdir('-p', this.settings.output);
    !isRoot() && mkdir('-p', dirname);

    return writeFile(filename, htmlString, 'utf8')
      .then(() => {
        this.cache.output.add(isRoot() ? filename : dirname);
        return { dirname, filename };
      })
      .catch(err => this.hooks.emit(EVENTS.ERROR, err));
  }
}

Core.EVENTS = EVENTS;
Core.MESSAGES = MESSAGES;

module.exports = Core;
