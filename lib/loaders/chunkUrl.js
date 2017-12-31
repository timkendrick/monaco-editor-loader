const loaderUtils = require('loader-utils');

const { COMPILATION_METADATA } = require('./compile');

module.exports = function chunkUrl(source, map, meta) {
  const { assetIndex = 0, publicPath = undefined } = loaderUtils.getOptions(this) || {};
  if (!meta || (typeof meta !== 'object') || !(COMPILATION_METADATA in meta)) {
    throw new Error('Chunk URL loader must immediately follow a compile loader');
  }
  const filenames = meta[COMPILATION_METADATA];
  if (filenames.length === 0) { throw new Error('No files emitted by compilation'); }
  const filename = filenames[assetIndex];
  return `module.exports = ${
    typeof publicPath === 'string'
      ? JSON.stringify(publicPath ? `${publicPath.replace(/\/$/, '')}/${filename}` : filename)
      : `__webpack_public_path__ + ${JSON.stringify(filename)}`
  };`;
};
