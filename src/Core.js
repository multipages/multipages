const { readdirSync, statSync, existsSync, writeFileSync } = require('fs');
const { resolve, normalize } = require('path');

const { rm, mkdir } = require('shelljs');
const { JSDOM: Parse } = require('jsdom');

const removePath = pathfile => existsSync(pathfile) && rm('-rf', pathfile);
const resolvePath = (pathfile, context) => resolve(context !== undefined ? context : process.cwd(), pathfile);
const hasPath = filepath => existsSync(filepath);

const defaultSettings = {
  rootPath: './src/templates',
  pagesPath: './src/templates/pages',
  output: './dist',
  engine: null,
  middlewares: [],
  paramSymbol: '@',
  async data() {
    return Promise.resolve({
      params: {},
      data: {}
    });
  },
};

const EVENTS = {
  FILE_PATHS_CREATED: 'filePathsCreated',
  ERROR: 'error'
};

const MESSAGES = {
  NOT_ENGINE: 'Please attach a template engine extension at plugin!'
};

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

    // Verify engine
    if (!this.settings.engine) {
      return this.hooks.emit('error', new Error(MESSAGES.NOT_ENGINE));
    }

    this.engine = this.settings.engine.setup(this.settings.rootPath);

    // Set parameter pattern regex
    this.paramPattern = new RegExp(`(?=${this.settings.paramSymbol})`, 'g');

    // Set cache for rebuild
    this.cache = new Set();
  }

  createFilePathList(targetPath, ext = /(\.html)$/) {
    const paths = [];

    const walk = (directory) => {
      const files = readdirSync(directory);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filePath = resolvePath(file, directory);

        if (statSync(filePath).isDirectory()) {
          walk(filePath);
          continue;
        }

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
        let route = path
          // remove rootPath
          .replace(this.settings.pagesPath, '')
          // change double back-slash to a single slash
          .replace(/\\/g, '/');

        let routeSplit = route.split('/');

        // remove filename and extension
        route = routeSplit.slice(0, routeSplit.length - 1).join('/');

        // fix root and return route and file
        return {
          route: (route) ? route : '/',
          file: routeSplit[routeSplit.length - 1]
        };
      })
      .sort((routeA, routeB) => {
        // To order routes from root to more complex
        const a = routeA.route.split('/').length + routeA.route.length;
        const b = routeB.route.split('/').length + routeB.route.length;

        return (a > b) ? 1 : (a < b) && -1;
      });

    return routerList;
  }

  dataHandler(route) {
    return this.settings.data(route);
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

    let pages = router.map(async ({ route, file }) => {

      let dataFile;

      if (/(?=@)/g.test(route)) {
        dataFile = await this.dataHandler(route);

        return dataFile.map(({ params, data }) => {
          let pagename = this.createPathByParams(route, params);

          return {
            data: data,
            route: route,
            page: pagename,
            file: file
          };
        });
      }

      let { data } = await this.dataHandler(route);

      return {
        data: data,
        route: route,
        page: route,
        file: file
      };
    });

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

  clearOutput() {
    Array.from(this.cache).forEach(template => removePath(template));
  }

  createOutput() {
    !hasPath(this.settings.output) && mkdir('-p', this.settings.output);
  }

  async run() {
    const filePathList = this.createFilePathList(this.settings.pagesPath, this.engine.ext);
    const routerList = this.createRouterList(filePathList);
    const pages = await this.createPageList(routerList);

    this.clearOutput();
    this.createOutput();

    return pages.map(({ data, route, page, file }) => {
      const template = resolvePath(`${this.settings.pagesPath}${normalize(`${route}/${file}`)}`);
      const compiled = this.engine.compile(template, data);

      this.cache.add(template);
      // parse html
      const parsedDOM = new Parse(compiled);

      // run middleware
      const context = this.executeMiddleWares({ parsedDOM, data });

      // serialized processed html
      const serialized = context.parsedDOM.serialize();

      // render serialized
      return this.render(serialized, page);
    });
  }

  render(htmlString, page) {
    const dirname = resolvePath(`${this.settings.output}${normalize(page)}`, '');
    const filename = resolvePath('index.html', dirname);

    !hasPath(dirname) && mkdir('-p', dirname);
    !hasPath(filename) && writeFileSync(filename, htmlString);

    return { dirname, filename };
  }
}

Core.EVENTS = EVENTS;
Core.MESSAGES = MESSAGES;

module.exports = Core;
