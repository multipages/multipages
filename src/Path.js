const { resolve } = require('path');
const { readdirSync } = require('fs');
const { stat } = require('fs').promises;

module.exports = class Path {
  constructor(rootPath) {
    this.rootPath = resolve(process.cwd(), rootPath);
  }

  async walk(directory, paths = []) {
    const files = readdirSync(directory);

    for (let i = 0; i < files.length; i++) {
      let file = resolve(directory, files[i]);
      let fileStat = await stat(file);

      if (fileStat.isDirectory()) {
        await this.walk(file, paths);
        continue;
      }

      paths.push({ file, directory });
    }

    return paths;
  }

  async fetch() {
    return await this.walk(this.rootPath);
  }
}
