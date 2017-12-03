const fs = require('fs');
const path = require('path');
const loaderUtils = require('loader-utils');
const urlLoader = require('url-loader');
const blobLoader = require('./blob-loader');

module.exports = function monacoAssetLoader(source) {
  if (this.cacheable) { this.cacheable(); }
  const { type, config } = loaderUtils.getOptions(this) || {};
  switch (type) {
    case 'css': return urlLoader.call(this, source);
    case 'worker': return blobLoader.call(this, processWorkerSource(source, config));
    default: throw new Error(`Invalid asset type for ${path.relative(process.cwd(), this.resourcePath)}: ${type}`);
  }
};

function processWorkerSource(source, config) {
  const scripts = Object.keys(config.scripts).reduce((acc, key) => Object.assign(acc, {
    [key]: fs.readFileSync(config.scripts[key], 'utf8'),
  }), {});
  return `
self.MonacoEnvironment = {
  baseUrl: 'script://',
};
var mockImportScripts = (function(importScripts, scripts) {
  return function() {
    return importScripts.apply(this, Array.prototype.map.call(arguments, function (id) {
      const path = id.replace(/^script:\\/\\//, '');
      return (path in scripts ? scripts[path] : path);
    }));
  };
})(self.importScripts, {
  ${Object.keys(scripts).map((id) =>
    `${JSON.stringify(id)}: URL.createObjectURL(new Blob([${JSON.stringify(scripts[id])}], { type: "text/javascript" }))`
  ).join(',\n')}
});

(function (importScripts) {
${source}
})(mockImportScripts)`;
}
