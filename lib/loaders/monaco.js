const path = require('path');
const loaderUtils = require('loader-utils');

module.exports.pitch = function pitch(remainingRequest) {
  const { modules = [], workers = [], workerOptions = {} } = loaderUtils.getOptions(this) || {};
  return `
(function(workerUrls) {
  (global.MonacoEnvironment || (global.MonacoEnvironment = {})).getWorkerUrl = function(workerId, label) {
    var baseUrl = (typeof global.MonacoEnvironment.baseUrl === "string"
      ? global.MonacoEnvironment.baseUrl
      : ${typeof workerOptions.baseUrl === 'string' ? JSON.stringify(workerOptions.baseUrl) : '__webpack_public_path__'}
    ).replace(/\\/$/, '');
    var scriptPath = workerId in workerUrls ? workerUrls[workerId] : workerId;
    var isAbsolutePath = /^(\\w+:|\\/)/.test(scriptPath);
    return (baseUrl && !isAbsolutePath ? baseUrl + "/" : "") + scriptPath + "#" + label;
  };
}({${
  workers.map(
    (worker) => `${
      JSON.stringify(worker.name)
    }: require(${
      loaderUtils.stringifyRequest(this, getWorkerPath(worker, workerOptions))
    })`
  ).join(',\n')
}}))

var main = require(${loaderUtils.stringifyRequest(this, `!!${remainingRequest}`)});
${
  getModuleEntryPoints(modules).map(
    (entry) => `require(${loaderUtils.stringifyRequest(this, entry)});`
  ).join('\n')
}
module.exports = main;`;
};

function getModuleEntryPoints(modules) {
  return modules.filter((module) => Boolean(module.include))
    .map((module) => path.join(module.root, module.main));
}

function getWorkerPath(worker, { inline, baseUrl, filename }) {
  return `${
    inline
      ? `${require.resolve('./blobUrl')}?${JSON.stringify({
        type: 'application/javascript',
        sourceMap: false,
      })}`
      : `${require.resolve('./chunkUrl')}?${JSON.stringify({
        publicPath: baseUrl,
      })}`
  }!${require.resolve('./compile')}?${JSON.stringify({
    target: 'worker',
    emit: !inline,
    output: filename,
  })}!${require.resolve('./include')}?${JSON.stringify({
    includes: worker.includes,
  })}!${worker.main}`;
}
