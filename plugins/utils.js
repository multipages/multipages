const fs = require('fs');
const path = require('path');

const shell = require('shelljs');

const prepareRender = templateEngine => (filename, data) => {
  try {
    return templateEngine.render(filename, data);
  } catch(err) {
    console.error(err);
  }
};

const createDir = (dirname, { output }) => {
  try {
    const dirpath = `${output}${dirname}`;

    shell.rm('-rf', path.resolve(dirpath));
    shell.mkdir('-p', path.resolve(dirpath));

    return true;
  } catch(err) {
    console.error(err);
  }
};

const createFile = (dirname, { name, output, htmlString }) => {
  try {
    fs.writeFileSync(
      path.resolve(`${output}${dirname}/${name}.html`),
      htmlString
    );
    return true;
  } catch(err) {
    console.error(err);
  }
};

const createPage = (options, render) => {
  const {
    filename,
    dirname,
    name,
    output,
    data
  } = options;

  // Render page
  let htmlString = render(filename, data);

  // Create Directory Path
  createDir(dirname, { output });

  // Create File with content
  createFile(dirname, {
    name,
    output,
    htmlString
  });
};

const getDataByPage = (resource, page) => {
  return (typeof resource === 'function') ? resource(page) : resource;
};

module.exports = {
  createDir,
  createFile,
  createPage,
  getDataByPage,
  prepareRender
}
