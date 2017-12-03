# @timkendrick/monaco-editor-loader
[![npm version](https://img.shields.io/npm/v/@timkendrick/monaco-editor-loader.svg)](https://www.npmjs.com/package/@timkendrick/monaco-editor-loader)
![Stability](https://img.shields.io/badge/stability-experimental-yellow.svg)

> Webpack loader for the Monaco editor

# Installation

```bash
npm install @timkendrick/monaco-editor-loader --save-dev
```

# Usage

This loader allows you to create a Monaco editor build with arbitrary extensions enabled, as well as optionally bundling CSS and web worker scripts into the main output.

## Scenario 1: Serving assets separately (requires external server):

```js
{
  loader: '@timkendrick/monaco-editor-loader',
  options: {
    config: {
      baseUrl: '/monaco-files', // This path will be prepended to CSS and web worker asset requests
    },
    extensions:  [
      '/path/to/vs/editor/editor.main.nls',
      ...
    ],
  },
}
```

## Scenario 2: Bundling asset files into main output (no server required):

```js
{
  loader: '@timkendrick/monaco-editor-loader',
  options: {
    assets: {
      'vs/editor/editor.main.css': {
        type: 'css',
        path: '/path/to/vs/editor/editor.main.css',
      },
      'vs/base/worker/workerMain.js': {
        type: 'worker',
        path: '/path/to/vs/base/worker/workerMain.js',
        config: {
          scripts: {
            'vs/language/typescript/src/worker.js': '/path/to/src/worker.js',
            'vs/language/typescript/lib/typescriptServices.js': '/path/to/typescriptServices.js',
            ...
          },
        },
      },
      ...
    },
    extensions:  [
      '/path/to/vs/editor/editor.main.nls',
      ...
    ],
  },
}
```

If both `baseUrl` and `assets` are provided, any resources specified in the `assets` configuration will be loaded from the compiled bundle, while any others will be loaded in at runtime from the path specified by `baseUrl`.

See the [@timkendrick/monaco-editor](https://github.com/timkendrick/monaco-editor/blob/master/webpack.config.js) repository for a real-life example.

# Loader options

| Name | Type | Required | Default | Description |
| ----- | ---- | -------- | ------- | ----------- |
| `extensions` | `Array<string>` | No | `[]` | Paths to Monaco plugin AMD module definition files |
| `assets` | `{[path]: [asset]}` | No | `{}` | Assets to be bundled into the compiled output |
| `config` | `{}` | No | `{}` | AMD configuration object passed to the internal Monaco module loader |
| `config.baseUrl` | `string` | No | `""` | Path from which to load any assets not present in the compiled output bundle |
| `entry` | `string` | No | `"vs/editor/editor.main"` | AMD module name to use as the main entry point |
| `debug` | `boolean` | No | `false` | Whether to log debug information during the Webpack build |

## Asset types

There are two asset types: `css` and `worker`. They are defined as follows:

```typescript
interface CssAsset {
  type: "css",
  path: string, // Path to CSS file
}

interface WorkerAsset {
  type: "worker",
  path: string, // Path to worker JS file
  config: {
    scripts: {
      [moduleId]: string, // Remote worker scripts to bundle into the worker JS file (keyed by AMD module name)
    },
  },
}
```
