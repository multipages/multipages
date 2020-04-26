const EventEmitter = require('events');

const Core = require('./Core');
const Data = require('./Data');
const Engine = require('./Engine');
const Middlewares = require('./Middlewares');

const defaultSettings = {
  includesPath: './src/templates',
  pagesPath: './src/templates/pages',
  output: './dist',
  engine: null,
  middlewares: [],
  paramSymbol: '@',
  async fetchData(route) {
    return {
      params: {},
      data: {}
    };
  },
};

module.exports = function CoreAdapter(options) {
  const settings = Object.assign({}, defaultSettings, options);

  return new Core({
    settings,
    data:  new Data(settings.fetchData),
    hooks: new EventEmitter(),
    engine: new Engine(settings.includesPath, settings.engine),
    middlewares: new Middlewares(settings.middlewares)
  });
};
