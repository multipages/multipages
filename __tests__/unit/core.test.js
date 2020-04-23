const fs = require('fs');
const path = require('path');

const shell = require('shelljs');
const webpack = require('webpack');

const Core = require('../../src');

const MultiPageNunjucksExtension = require('../../__fixtures__/extensions');

describe('MultiPage:Core', () => {
  test('should create all html file paths from pagesPath', () => {
    const expected =  [
      '/contact/index.html',
      '/index.html',
      '/products/@category/@subcategory/@productId/index.html',
      '/products/@category/@subcategory/index.html',
      '/products/@category/index.html',
      '/products/index.html'
    ];

    const actualWithpagesPath = new Core({
      rootPath: './__fixtures__/source',
      pagesPath: './__fixtures__/source'
    }).createFilePathList();

    expect(actualWithpagesPath).toEqual(expected);

    const actualWithParamPath = new Core({
      rootPath: './__fixtures__/source',
      pagesPath: './__fixtures__/source'
    }).createFilePathList('./__fixtures__/source');

    expect(actualWithParamPath).toEqual(expected);
  });

  test('should trigger filePathsCreated hook', (done) => {
    const expected =  [
      '/contact/index.html',
      '/index.html',
      '/products/@category/@subcategory/@productId/index.html',
      '/products/@category/@subcategory/index.html',
      '/products/@category/index.html',
      '/products/index.html'
    ];

    const multipages = new Core({
      rootPath: './__fixtures__/source',
      pagesPath: './__fixtures__/source'
    });

    let pages = [];

    multipages.hooks.on('filePathsCreated', (paths) => {
      expect(paths).toEqual(expected);
      done();
    });

    pages = multipages.createFilePathList();

  });

  test('shoud create router list from pagesPath', () => {
    const expected =  [
      '/',
      '/contact',
      '/products',
      '/products/@category',
      '/products/@category/@subcategory',
      '/products/@category/@subcategory/@productId'
    ];

    const plugin = new Core({
      rootPath: './__fixtures__/source',
      pagesPath: './__fixtures__/source'
    });

    const routes = plugin.createRouterList();

    plugin.settings.data().then((dataDefault) => {
      expect(routes.map(({route}) => route)).toEqual(expected);
      expect(Object.keys(dataDefault)).toEqual(expect.arrayContaining(['params', 'data']));
    });
  });

  test('should create page list given route list', (done) => {
    const expected = [
      '/',
      '/contact',
      '/products',
      '/products/technology',
      '/products/sports',
      '/products/technology/computer',
      '/products/technology/monitor',
      '/products/technology/computer/motherboard',
      '/products/technology/monitor/monitor-27-black'
    ];

    new Core({
      rootPath: './__fixtures__/source',
      pagesPath: './__fixtures__/source',
      async data(route) {
        return require(`../../__fixtures__/data${route}`);
      }
    })
    .createPageList()
    .then(pages => {
      expect(pages.length).toBe(9);
      expect(pages.map(({ page }) => page)).toEqual(expected);
      expect(Object.keys(pages[0])).toEqual(['data', 'route', 'page', 'file']);
      done();
    });

  });

  test('should dataHandler return correspondent data given specific route', (done) => {
    const productsData = require('../../__fixtures__/data/products');
    const categoryData = require('../../__fixtures__/data/products/@category');
    const subcategoryData = require('../../__fixtures__/data/products/@category/@subcategory');
    const productIdData = require('../../__fixtures__/data/products/@category/@subcategory/@productId');

    const multiPageCore = new Core({
      rootPath: './__fixtures__/source',
      pagesPath: './__fixtures__/source',
      async data(route) {
        return require(`../../__fixtures__/data${route}`);
      }
    });

    Promise.all([
      multiPageCore.dataHandler('/products'),
      multiPageCore.dataHandler('/products/@category'),
      multiPageCore.dataHandler('/products/@category/@subcategory'),
      multiPageCore.dataHandler('/products/@category/@subcategory/@productId'),
    ]).then(data => {
      expect(data[0]).toBe(productsData);
      expect(data[1]).toBe(categoryData);
      expect(data[2]).toBe(subcategoryData);
      expect(data[3]).toBe(productIdData);
      done();
    })
  });

  test.only('should generate output pages', (done) => {
    const expected = [
      {
        dirname: 'C:\\Users\\simaodeveloper_pc\\Documents\\MonkeyTech\\open-source\\multipages-core\\__fixtures__\\dist',
        filename: 'C:\\Users\\simaodeveloper_pc\\Documents\\MonkeyTech\\open-source\\multipages-core\\__fixtures__\\dist\\index.html'
      },
      {
        dirname: 'C:\\Users\\simaodeveloper_pc\\Documents\\MonkeyTech\\open-source\\multipages-core\\__fixtures__\\dist\\contact',
        filename: 'C:\\Users\\simaodeveloper_pc\\Documents\\MonkeyTech\\open-source\\multipages-core\\__fixtures__\\dist\\contact\\index.html'
      },
      {
        dirname: 'C:\\Users\\simaodeveloper_pc\\Documents\\MonkeyTech\\open-source\\multipages-core\\__fixtures__\\dist\\products',
        filename: 'C:\\Users\\simaodeveloper_pc\\Documents\\MonkeyTech\\open-source\\multipages-core\\__fixtures__\\dist\\products\\index.html'
      },
      {
        dirname: 'C:\\Users\\simaodeveloper_pc\\Documents\\MonkeyTech\\open-source\\multipages-core\\__fixtures__\\dist\\products\\technology',
        filename: 'C:\\Users\\simaodeveloper_pc\\Documents\\MonkeyTech\\open-source\\multipages-core\\__fixtures__\\dist\\products\\technology\\index.html'
      },
      {
        dirname: 'C:\\Users\\simaodeveloper_pc\\Documents\\MonkeyTech\\open-source\\multipages-core\\__fixtures__\\dist\\products\\sports',
        filename: 'C:\\Users\\simaodeveloper_pc\\Documents\\MonkeyTech\\open-source\\multipages-core\\__fixtures__\\dist\\products\\sports\\index.html'
      },
      {
        dirname: 'C:\\Users\\simaodeveloper_pc\\Documents\\MonkeyTech\\open-source\\multipages-core\\__fixtures__\\dist\\products\\technology\\computer',
        filename: 'C:\\Users\\simaodeveloper_pc\\Documents\\MonkeyTech\\open-source\\multipages-core\\__fixtures__\\dist\\products\\technology\\computer\\index.html'
      },
      {
        dirname: 'C:\\Users\\simaodeveloper_pc\\Documents\\MonkeyTech\\open-source\\multipages-core\\__fixtures__\\dist\\products\\technology\\monitor',
        filename: 'C:\\Users\\simaodeveloper_pc\\Documents\\MonkeyTech\\open-source\\multipages-core\\__fixtures__\\dist\\products\\technology\\monitor\\index.html'
      },
      {
        dirname: 'C:\\Users\\simaodeveloper_pc\\Documents\\MonkeyTech\\open-source\\multipages-core\\__fixtures__\\dist\\products\\technology\\computer\\motherboard',
        filename: 'C:\\Users\\simaodeveloper_pc\\Documents\\MonkeyTech\\open-source\\multipages-core\\__fixtures__\\dist\\products\\technology\\computer\\motherboard\\index.html'
      },
      {
        dirname: 'C:\\Users\\simaodeveloper_pc\\Documents\\MonkeyTech\\open-source\\multipages-core\\__fixtures__\\dist\\products\\technology\\monitor\\monitor-27-black',
        filename: 'C:\\Users\\simaodeveloper_pc\\Documents\\MonkeyTech\\open-source\\multipages-core\\__fixtures__\\dist\\products\\technology\\monitor\\monitor-27-black\\index.html'
      }
    ];

    const plugin = new Core({
      rootPath: './__fixtures__/source',
      pagesPath: './__fixtures__/source',
      output: './__fixtures__/dist',
      engine: new MultiPageNunjucksExtension(),
      async data(route) {
        return require(`../../__fixtures__/data${route}`);
      }
    })

    plugin
    .run()
    .then(() => plugin.run())
    .then(actual => {
      expect(actual).toEqual(expect.arrayContaining(expected));
      done();
    });
  });

  test('should generate without pass data', (done) => {
    const plugin = new Core({
      rootPath: './__fixtures__/source',
      pagesPath: './__fixtures__/source',
      output: './__fixtures__/dist',
      engine: new MultiPageNunjucksExtension(),
      middlewares: [
        function(context, next) {
          next();
        }
      ]
    });

    plugin.run().then(actual => {
      expect(actual).toBeDefined();
      done();
    })
  });

  test('should emit a error when engine is not defined', (done) => {
    const plugin = new Core({
      rootPath: './__fixtures__/source',
      pagesPath: './__fixtures__/source',
      output: './__fixtures__/dist',
      middlewares: [
        (context, next) => next(),
      ]
    });

    plugin.hooks.on(Core.EVENTS.ERROR, (err) => {
      expect(err.message).toBe(Core.MESSAGES.NOT_ENGINE);
      done();
    })

    plugin.run();
  })
});
