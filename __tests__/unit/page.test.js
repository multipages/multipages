const Pages = require('../../src/CoreNext');
const Data = require('../../src/Data');
const Engine = require('../../src/Engine');
const Middlewares = require('../../src/Middlewares');

const EventEmitter = require('events');

const source = './__fixtures__/source';
const data = './__fixtures__/data';

const expectedTemplate = '<!DOCTYPE html>\r\n' +
  '<html lang="en">\r\n' +
  '<head>\r\n' +
  '  <meta charset="UTF-8">\r\n' +
  '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\r\n' +
  '  <title>Document</title>\r\n' +
  '</head>\r\n' +
  '<body>\r\n' +
  '\r\n' +
  '</body>\r\n' +
  '</html>\r\n';

describe('Pages:Class', () => {
  let pages;

  beforeEach(() => {
    pages = new Pages(
      source,
      new Data((route) => require(`${data}${route}`)),
      new EventEmitter(),
      new Engine(),
      new Middlewares([])
    )
  })

  test('should fetch a list of files given a rootPath', async () => {
    const expected = "C:\\Users\\simaodeveloper_pc\\Documents\\MonkeyTech\\open-source\\multipages-core\\__fixtures__\\source\\contact\\index.html";

    console.time('timestamp:fetchFiles');
    const actual = await pages.fetchFiles();
    console.timeEnd('timestamp:fetchFiles');

    expect(actual[0].file).toBe(expected);
  });

  test('should fetch a list of file and templates given a rootPath', async () => {

    console.time('timestamp:fetchTemplates');
    await pages.fetchFiles();
    const actual = await pages.fetchTemplates();
    console.timeEnd('timestamp:fetchTemplates');

    expect(actual[0].template).toBe(expectedTemplate);
  });

  test('should extract a list of routes given a rootPath', async () => {

    console.time('timestamp:extractRoutes');
    await pages.fetchFiles();
    await pages.fetchTemplates();
    const actual = await pages.extractRoutes();
    console.timeEnd('timestamp:extractRoutes');

    expect(actual[0].route).toBe('/');
    expect(actual[1].route).toBe('/contact/');
    expect(actual[2].route).toBe('/products/');
  });
})

