const fs = require('fs');
const path = require('path');

const shell = require('shelljs');
const webpack = require('webpack');

const Core = require('../../src');

describe('MultiPage Core', () => {
  test('should create all html file paths from pagesPath', () => {
    const expected =  [
      'C:\\Users\\simaodeveloper_pc\\Documents\\MonkeyTech\\open-source\\nunjucks-webpack-template-plugin\\fixtures\\findAllFilePaths\\contact\\index.html',
      'C:\\Users\\simaodeveloper_pc\\Documents\\MonkeyTech\\open-source\\nunjucks-webpack-template-plugin\\fixtures\\findAllFilePaths\\index.html',
      'C:\\Users\\simaodeveloper_pc\\Documents\\MonkeyTech\\open-source\\nunjucks-webpack-template-plugin\\fixtures\\findAllFilePaths\\products\\@category\\@subcategory\\@productId\\index.html',
      'C:\\Users\\simaodeveloper_pc\\Documents\\MonkeyTech\\open-source\\nunjucks-webpack-template-plugin\\fixtures\\findAllFilePaths\\products\\@category\\@subcategory\\index.html',
      'C:\\Users\\simaodeveloper_pc\\Documents\\MonkeyTech\\open-source\\nunjucks-webpack-template-plugin\\fixtures\\findAllFilePaths\\products\\@category\\index.html',
      'C:\\Users\\simaodeveloper_pc\\Documents\\MonkeyTech\\open-source\\nunjucks-webpack-template-plugin\\fixtures\\findAllFilePaths\\products\\index.html'
    ];

    const actualWithpagesPath = new Core({
      rootPath: './fixtures/findAllFilePaths',
      pagesPath: './fixtures/findAllFilePaths'
    }).createFilePathList();

    expect(actualWithpagesPath).toEqual(expected);

    const actualWithParamPath = new Core({
      rootPath: './fixtures/findAllFilePaths',
      pagesPath: './fixtures/findAllFilePaths'
    }).createFilePathList('./fixtures/findAllFilePaths');

    expect(actualWithParamPath).toEqual(expected);
  });

  test('should trigger filePathsCreated hook', (done) => {
    const expected =  [
      'C:\\Users\\simaodeveloper_pc\\Documents\\MonkeyTech\\open-source\\nunjucks-webpack-template-plugin\\fixtures\\findAllFilePaths\\contact\\index.html',
      'C:\\Users\\simaodeveloper_pc\\Documents\\MonkeyTech\\open-source\\nunjucks-webpack-template-plugin\\fixtures\\findAllFilePaths\\index.html',
      'C:\\Users\\simaodeveloper_pc\\Documents\\MonkeyTech\\open-source\\nunjucks-webpack-template-plugin\\fixtures\\findAllFilePaths\\products\\@category\\@subcategory\\@productId\\index.html',
      'C:\\Users\\simaodeveloper_pc\\Documents\\MonkeyTech\\open-source\\nunjucks-webpack-template-plugin\\fixtures\\findAllFilePaths\\products\\@category\\@subcategory\\index.html',
      'C:\\Users\\simaodeveloper_pc\\Documents\\MonkeyTech\\open-source\\nunjucks-webpack-template-plugin\\fixtures\\findAllFilePaths\\products\\@category\\index.html',
      'C:\\Users\\simaodeveloper_pc\\Documents\\MonkeyTech\\open-source\\nunjucks-webpack-template-plugin\\fixtures\\findAllFilePaths\\products\\index.html'
    ];

    const multipages = new Core({
      rootPath: './fixtures/findAllFilePaths',
      pagesPath: './fixtures/findAllFilePaths'
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

    const routes = new Core({
      rootPath: './fixtures/findAllFilePaths',
      pagesPath: './fixtures/findAllFilePaths'
    }).createRouterList();

    expect(routes).toEqual(expected);
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
      rootPath: './fixtures/findAllFilePaths',
      pagesPath: './fixtures/findAllFilePaths',
      async data(route) {
        return require(`../../fixtures/data${route}`);
      }
    })
    .createPageList()
    .then(pages => {
      expect(pages.length).toBe(9);
      expect(pages.map(({ page }) => page)).toEqual(expected);
      expect(Object.keys(pages[0])).toEqual(['data', 'route', 'page']);
      done();
    });

  });

  test('should dataHandler return correspondent data given specific route', (done) => {
    const productsData = require('../../fixtures/data/products');
    const categoryData = require('../../fixtures/data/products/@category');
    const subcategoryData = require('../../fixtures/data/products/@category/@subcategory');
    const productIdData = require('../../fixtures/data/products/@category/@subcategory/@productId');

    const multiPageCore = new Core({
      rootPath: './fixtures/findAllFilePaths',
      pagesPath: './fixtures/findAllFilePaths',
      async data(route) {
        return require(`../../fixtures/data${route}`);
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

  test('should static method clearPath remove a path directory or file', (done) => {
    const filepath = path.resolve(process.cwd(), './fixtures/temp/folderToBeRemoved');
    let expected = shell.mkdir('-p', filepath);

    setTimeout(() => {
      Core.clearPath('./fixtures/temp/folderToBeRemoved');

      if(!fs.existsSync(filepath)) {
        expected = 'removed!';
      }

      expect('removed!').toBe(expected);
      done()
    }, 10);
  });

  test('should add settings after instantiate', () => {

    const multiPageCore = new Core({
      rootPath: './fixtures/findAllFilePaths',
      pagesPath: './fixtures/findAllFilePaths'
    });

    const actual = multiPageCore.settings.output;
    const expected = path.resolve(process.cwd(), './fixtures/temp');

    multiPageCore.addSettings({
      invalidOption: false
    });

    expect(multiPageCore.settings.invalidOption).toBe(undefined);

    multiPageCore.addSettings({
      output: ''
    });

    expect(multiPageCore.settings.output).toBe(actual);

    multiPageCore.addSettings({
      output: expected
    });

    expect(multiPageCore.settings.output).toBe(expected);
  })
});
