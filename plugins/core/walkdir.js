const fs = require('fs');
const path = require('path');

module.exports = function walkDir(dirPath) {
  const paths = [];

  const walk = (directory) => {
    const files = fs.readdirSync(directory);

    files.forEach(file => {
      const filePath = path.resolve(directory, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        return walk(filePath);
      }

      if (/\.(njk|nunjucks|html)$/g.test(path.extname(filePath))) {
        const relativePath = filePath.replace(dirPath, '');
        const splitedPath = relativePath.split('\\');

        const [name] = splitedPath[splitedPath.length - 1].split(/\./);
        const dirname = splitedPath.slice(0, splitedPath.length - 1).join('/');
        const filename = relativePath.replace(/\\/g, '/');

        return paths.push({
          filename,
          name,
          dirname: dirname ? dirname : '/',
          ext: path.extname(filePath)
        });
      }
    });
  };

  walk(dirPath);

  return paths;
};
