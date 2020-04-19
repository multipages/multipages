const fs = require('fs');
const path = require('path');

const shell = require('shelljs');

const removeFile = (filename) => {

  const filepath = path.resolve(filename);

  if (!fs.existsSync(filepath)) {
    return false;
  }

  shell.rm('-rf', path.resolve(filepath));
}

const createDir = (dirname) => {
  const dirpath = path.resolve(dirname);

  if (!fs.existsSync(dirpath)) {
    shell.mkdir('-p', dirpath);
  }
};

const createFile = (filename, htmlString ) => {
  if (!fs.existsSync(dirpath)) {
    fs.writeFileSync(filename, htmlString);
  }
};

module.exports = {
  removeFile,
  createDir,
  createFile,
}
