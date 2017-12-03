const mime = require('mime');

module.exports = function blobLoader(source) {
  if (this.cacheable) { this.cacheable(); }
  return `module.exports = URL.createObjectURL(new Blob([${JSON.stringify(source)}], { type: ${JSON.stringify(mime.getType(this.resourcePath))} }));`;
};
