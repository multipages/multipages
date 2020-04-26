const { resolve } = require('path');
const { readdir, readFile, stat } = require('fs').promises;

const removeChunk = (chunk, str) => str.replace(chunk, '');
const normalizeBackSlash = str => str.replace(/\\/g, '/');
const removeFilename = (str, regex) => str.replace(regex, '/');
const hasFilename = (str, regex) => regex.test(str);
const fixRootRoute = str => `${str}/`;

class Page {
  constructor(rootPath, filePath, path, source) {


    this.rootPath = rootPath;
    this.filePath = filePath;
    this.path = path;
    this.source = source;
    this.fileRegex = /\/\w+\.\w+$/;
  }

  async fetchTemplate() {
    return await readFile(this.filePath, 'utf8');
  }

  extractRoute() {
    let route = normalizeBackSlash(
      removeChunk(this.rootPath, this.filePath)
    );

    return hasFilename(route, this.fileRegex)
      ? removeFilename(route, this.fileRegex)
      : fixRootRoute(route);
  }
}

Page.fetchPagesPath = async function fetchFiles(pagesPath) {
  const paths = [];

  const walk = async directory =>  {
    const files = await readdir(directory, 'utf8');
    const filesLength = files.length;

    for (let i = 0; i < filesLength; i++) {
      let file = resolve(directory, files[i]);
      let fileStat = await stat(file);

      if (fileStat.isDirectory()) {
        await walk(file);
        continue;
      }

      paths.push(file);
    }
  };

  await walk(pagesPath);

  return paths;
}

Page.extractPagesFromSource = function(sources, page) {
  let route = page.extractRoute();

  return sources.map(source => {
    let path = route;
    let re = /@\w+[^/]/g;
    let match;

    while(match = re.exec(route)) {
      path = path.replace(match[0], source.params[match[0]])
    }

    return new Page(
      page.rootPath,
      page.filePath,
      path,
      source
    );
  });
}

module.exports = Page;
