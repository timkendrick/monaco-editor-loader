const path = require('path');
const loaderUtils = require('loader-utils');

module.exports = function monacoEditorLoader(source) {
  if (this.cacheable) this.cacheable();
  const {
    assets = {},
    extensions = [],
    config = {},
    entry = 'vs/editor/editor.main',
    debug = false,
  } = loaderUtils.getOptions(this) || {};
  const amdConfig = {
    ...config,
    ignoreDuplicateModules: config.ignoreDuplicateModules || [
      // https://github.com/Microsoft/vscode/blob/a876cd019d6091e89c0835018e4b5bacc11d9c04/src/vs/editor/editor.main.ts#L50-L59
      'vscode-languageserver-types',
      'vscode-languageserver-types/main',
      'vscode-nls',
      'vscode-nls/vscode-nls',
      'jsonc-parser',
      'jsonc-parser/main',
      'vscode-uri',
      'vscode-uri/index',
    ],
  };
  if (debug) {
    global.console.log(
      `Loading Monaco module: ${path.relative(process.cwd(), this.resource).replace(/\.js$/, '')}`
    );
  }
  return [
    header(assets, amdConfig),
    source,
    footer(entry, assets, extensions, amdConfig, debug),
  ].join('\n');
};

function header(assets, config) {
  return `
const { require: amdRequire, define: amdDefine } = require(${
  JSON.stringify(`!!${require.resolve('./monaco-amd')}`)
})(${JSON.stringify(config)}, {${
  Object.keys(assets).map(
    (id) => `${JSON.stringify(id)}: require(${JSON.stringify(
      `${require.resolve('./monaco-asset-loader')}?${JSON.stringify({
        type: assets[id].type,
        config: assets[id].config,
      })}!${assets[id].path}`
    )})`
  ).join(',\n')
}});

((module, exports, process, require, define) => {
`;
}

function footer(entry, assets, extensions, config, debug) {
  return `
})(undefined, undefined, undefined, amdRequire, amdDefine);

${
  extensions.map((extension) =>
    `amdDefine.import(require(${JSON.stringify(`!!${__filename}?${JSON.stringify({ assets, config, entry: null, debug })}!${extension}`)}))`
  ).join(',\n')
}

module.exports = ${entry ? `amdRequire([${JSON.stringify(entry)}, ...Object.keys(amdDefine.getModules())], (main) => main)` : 'amdDefine.getModules()'};

${entry ? 'window.require = amdRequire;' : ''}`;
}
