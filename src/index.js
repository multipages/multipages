const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

const shell = require('shelljs');
const { JSDOM: Parse } = require('jsdom');

const defaultSettings = {
  rootPath: './src/templates',
  pagesPath: './src/templates/pages',
  output: './dist',
  engine: null,
  paramSymbol: '@',
  async data() {},
};

class Core {
  constructor(settings, hooks) {
    this.settings = {
      ...defaultSettings,
      ...settings,
      rootPath: path.resolve(process.cwd(), settings.rootPath || defaultSettings.rootPath),
      pagesPath: path.resolve(process.cwd(), settings.pagesPath || defaultSettings.pagesPath),
      output: path.resolve(process.cwd(), settings.output || defaultSettings.output),
    };

    this.hooks = hooks || new EventEmitter();

    this.hooks.on('filePathsCreated', () => {});
    this.hooks.on('errors', () => {});

    if (!this.settings.engine) {
      return this.hooks.emit('errors', new Error('Please attach a template engine extension at MultiPagePlugin!'));
    }

    this.engine = this.settings.engine.setup(this.settings.rootPath);

    this.paramPattern = new RegExp(`(?=${this.settings.paramSymbol})`, 'g');
  }

  static clearPath(pathname) {
    const resolvedPath = path.resolve(process.cwd(), pathname);

    if(fs.existsSync(resolvedPath)) {
      shell.rm('-rf', resolvedPath);
      return true;
    }

    return false;
  }

  addSettings(options) {
    const isPath = (target) => ['rootPath', 'pagesPath', 'output'].includes(target);

    Object.keys(options).forEach(option => {
      if (option in defaultSettings) {
        this.settings[option] = options[option] || defaultSettings[option];

        if (isPath(option)) {
          this.settings[option] = path.resolve(process.cwd(), this.settings[option]);
        }
      }
    });

    return this.settings;
  }

  createFilePathList(targetPath, ext = /(\.html)$/) {
    const paths = [];

    const walk = (directory) => {
      const files = fs.readdirSync(directory);

      files.forEach(file => {
        const filePath = path.resolve(directory, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          return walk(filePath);
        }

        ext.test(filePath) && paths.push(filePath);
      });
    };

    walk(targetPath
      ? path.resolve(process.cwd(), targetPath)
      : this.settings.pagesPath
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
          .replace(this.settings.rootPath, '')
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

  /**
   * @method createPageList
   * @description generate a list of info of all pages with data, route, page (final path)
   * @param {Array} routeList
   */
  async createPageList(routerList) {
    const router = routerList || this.createRouterList();

    const pageInfo = (data, route, page, file) => ({ data, route, page, file });

    let pages = router.map(async ({ route, file }) => {

      let dataFile;

      if (this.paramPattern.test(route)) {
        dataFile = await this.dataHandler(route);

        return dataFile.map(({ params, data }) => {
          let pagename = route;

          Object.keys(params).forEach((id) => {
            pagename = pagename.replace(id, params[id]);
          });

          return pageInfo(data, route, pagename, file);
        });
      }

      let { data } = await this.dataHandler(route);

      return pageInfo(data, route, route, file);
    });

    // // Resolve all promises
    try {
      pages = await Promise.all(pages)
    } catch(err) {
      console.log(err.message);
    }

    // // Flattening all pages
    pages = pages.flat(Infinity);

    return pages;
  }

  executeMiddleWares(context) {
    const middlewares = this.settings.middlewares || [];

    let length = middlewares.length;
    let counter = 0;

    function next() {
      if (counter < middlewares.length) {
         return middlewares[counter++](context, next);
      }

      return context;
    }

    return next();
  }

  async run() {
    const filePathList = this.createFilePathList(this.settings.pagesPath, this.engine.ext);
    const routerList = this.createRouterList(filePathList);
    const pages = await this.createPageList(routerList);

    return pages.map(({ data, route, page, file }) => {

      const template = this.createTemplatePath(route, file);
      const compiled = this.engine.compile(template, data);

      // parse html
      const parsedDOM = new Parse(compiled);

      // run middleware
      const context = this.executeMiddleWares({ parsedDOM, data });

      // serialized processed html
      const serialized = context.parsedDOM.serialize();

      // render serialized
      return this.render(serialized, page);
    })
  }

  createTemplatePath(route, file) {
    return path.resolve(`${this.settings.pagesPath}${path.normalize(`${route}/${file}`)}`);
  }

  render(htmlString, page) {
    const dirname = path.resolve(`${this.settings.output}${page}`);
    const filename = path.resolve(dirname, 'index.html');

    if (!fs.existsSync(dirname)) {
      shell.mkdir('-p', dirname);
    }

    if (fs.existsSync(dirname)) {
      fs.writeFileSync(filename, htmlString);
    }

    return {
      dirname,
      filename
    };
  }
}

module.exports = Core;

