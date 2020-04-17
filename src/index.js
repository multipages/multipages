const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

const shell = require('shelljs');

const defaultSettings = {
  rootPath: path.resolve(process.cwd(), './src/templates'),
  pagesPath: path.resolve(process.cwd(), './src/templates/pages'),
  output: path.resolve(process.cwd(), './dist'),
  async data() {},
};

class Core {
  constructor(settings, hooks) {
    this.settings = {
      ...defaultSettings,
      ...settings,
      rootPath: path.resolve(process.cwd(), settings.rootPath),
      pagesPath: path.resolve(process.cwd(), settings.pagesPath),
    };

    this.hooks = new EventEmitter();

    this.hooks.on('filePathsCreated', () => {});
  }

  addSettings(options) {
    Object.keys(options).forEach(option => {
      if (option in defaultSettings) {
        return this.settings[option] = options[option] || defaultSettings[option];
      }
    });
  }

  static clearPath(pathname) {
    const resolvedPath = path.resolve(process.cwd(), pathname);
    // if exists, remove it.
    fs.existsSync(resolvedPath) && shell.rm('-rf', resolvedPath);
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
    const routes = paths
      .map(path => {
        let route = path
          // remove rootPath
          .replace(this.settings.rootPath, '')
          // change double back-slash to a single slash
          .replace(/\\/g, '/');

        // remove filename and extension
        route = route.split('/').slice(0, route.split('/').length - 1).join('/');

        // fix root and return route
        return route ? route : '/';
      })
      .sort((routeA, routeB) => {
        // To order routes from root to more complex
        const a = routeA.split('/').length + routeA.length;
        const b = routeB.split('/').length + routeB.length;

        return (a > b) ? 1 : (a < b) && -1;
      });

    return routes;
  }

  dataHandler(route) {
    return this.settings.data(route);
  }

  /**
   * @method createPageList
   * @description generate a list of info of all pages with data, route, page (final path)
   * @param {Array} routeList
   */
  async createPageList(routeList) {
    const routes = routeList || this.createRouterList();

    const pageInfo = (data, route, page) => ({ data, route, page });

    let pages = routes.map(async (route) => {
      let dataFile;

      if (/(?=@)/g.test(route)) {
        dataFile = await this.dataHandler(route);

        return dataFile.map(({ params, data }) => {
          let pagename = route;

          Object.keys(params).forEach((id) => {
            pagename = pagename.replace(id, params[id]);
          });

          return pageInfo(data, route, pagename);
        });
      }

      return pageInfo(
        await this.dataHandler(route),
        route,
        route
      );
    });

    // // Resolve all promises
    pages = await Promise.all(pages);

    // // Flattening all pages
    pages = pages.flat(Infinity);

    return pages;
  }
}

module.exports = Core;

