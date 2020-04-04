const fs = require('fs');
const path = require('path');

const shell = require('shelljs');

const removeFile = (filename) => {
  const filepath = path.resolve(filename);

  if (fs.existsSync(filepath)) {
    return false;
  }

  shell.rm(path.resolve(filepath));
}

const createDir = (dirname) => {
  const dirpath = path.resolve(dirname);

  if (fs.existsSync(dirpath)) {
    return false;
  }

  try {
    shell.mkdir('-p', dirpath);

    return true;
  } catch(err) {
    console.error(err);
  }
};

const createFile = (filename, htmlString ) => {
  try {
    fs.writeFileSync(filename, htmlString);

    return true;
  } catch(err) {
    console.error(err);
  }
};

module.exports = {
  removeFile,
  createDir,
  createFile,
}
