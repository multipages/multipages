const fs = require('fs');
const path = require('path');

module.exports = function walkDir(dirPath) {
  const paths = [];

  const walk = (directory) => {
    const files = fs.readdirSync(directory);

    files.forEach(file => {
      const filePath = path.resolve(directory, file);
      const stat = fs.statSync(filePath);
      const relativePath = filePath.replace(this.options._rootPath, '');
      const splitedPath = relativePath.split('\\');

      const [name, ext] = splitedPath[splitedPath.length - 1].split(/\./);
      const dirname = splitedPath.slice(0, splitedPath.length - 1).join('/').replace(/^\/\w+\/?/, '/');
      const filename = relativePath.replace(/\\/g, '/').replace(/^\//, '');

      if (stat.isDirectory()) {
        walk(filePath);
      } else {
        paths.push({
          dirname,
          filename,
          name,
          ext
        });
      }
    });
  };

  walk(dirPath);

  return paths;
};
