const loaderUtils = require('loader-utils');

module.exports.pitch = function pitch(remainingRequest) {
  const { includes } = loaderUtils.getOptions(this);
  return [
    ...includes.map((include) => `require(${loaderUtils.stringifyRequest(this, include)})`),
    `module.exports = require(${loaderUtils.stringifyRequest(this, `!!${remainingRequest}`)});`,
  ].join('\n');
};
