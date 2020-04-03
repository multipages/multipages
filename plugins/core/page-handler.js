const {
  getDataByPage,
  createDir,
  createFile,
  createPage,
  prepareRender
} = require('../utils');

module.exports = function pageHandler(page, output) {
  let data;

  const render = prepareRender(this.templateEngine);

  const slugNames = Object.keys(this.options.slugs);
  const matchSlug = slugNames.filter(slugName => {
    const reSlug = new RegExp(slugName);
    return reSlug.exec(page.filename)
  });

  if (matchSlug.length > 0) {
    let slug = matchSlug[0].replace(/^[^@]\w+\/|\/$/, '');

    const dataSlugs = this.options.slugs[matchSlug[0]];

    dataSlugs.forEach(dataSlug => {
      const dirname = page.dirname.replace(slug, dataSlug.slug);

      data = getDataByPage(this.options.renderData, {slug: dirname});

      let mergedData = Object.assign({}, data, dataSlug);
      let htmlString = render(page.filename, mergedData);

      // Create Directory Path
      createDir(dirname, { output });

      // Create File with content
      createFile(dirname, {
        name: page.name,
        output,
        htmlString
      });

    });

  } else {
    data = getDataByPage(this.options.renderData, {
      slug: page.name === 'index' ? page.dirname : page.name
    });

    createPage({
      filename: page.filename,
      dirname: page.dirname,
      name: page.name,
      output,
      data
    }, render);
  }
};
