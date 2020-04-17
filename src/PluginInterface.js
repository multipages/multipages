
const PLUGIN_NAME = 'MultiPage';

class WebpackPluginInterface {
  constructor(options) {
    this.multipages = new MultiPages(options);
  }

  apply(compiler) {
    compiler.hooks.afterPlugins.tap(PLUGIN_NAME, compiler => {
      this.multipages.clearPath(compiler.outputPath);
    });

    // When compilation is done
    compiler.hooks.done.tapAsync(PLUGIN_NAME, (stats, callback) => {

      this.multipages.hooks.on('filePathsCreated', filePaths => {
        compilation.fileDependencies.add(filePaths);
      });

      this.multipages.run();

      callback();
    });
  }
}

new MultiPagePlugin(options)
