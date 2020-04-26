const CoreAdapter = require('./CoreAdapter');

let m = new CoreAdapter({
  includesPath: '../__fixtures__/source',
  pagesPath: '../__fixtures__/source',
  output: '../__fixtures__/dist'
  async fetchData(route) {
    return require(`../__fixtures__/data${route}`)
  }
});

m.execute();

module.exports = CoreAdapter;
