# @timkendrick/monaco-editor-loader
[![npm version](https://img.shields.io/npm/v/@timkendrick/monaco-editor-loader.svg)](https://www.npmjs.com/package/@timkendrick/monaco-editor-loader)
![Stability](https://img.shields.io/badge/stability-experimental-yellow.svg)

> Webpack loader for the Monaco editor

# Installation

```bash
npm install @timkendrick/monaco-editor-loader --save-dev
```

# Usage

This loader allows you to create a Monaco editor build with arbitrary extensions enabled, as well as optionally bundling web worker scripts into the main output.

See the [@timkendrick/monaco-editor](https://github.com/timkendrick/monaco-editor) repository for a real-life example.

## Scenario 1: Serving worker scripts separately (requires external server):

```js
{
  loader: '@timkendrick/monaco-editor-loader',
  options: {
    modules: [
      {
        name: 'vs',
        root: 'path/to/vscode/src',
      },
      {
        name: 'vs/extension/name',
        root: 'path/to/extension/src',
        main: 'monaco.contribution',
        include: true,
      },
      {
        name: 'vs/library/name',
        root: 'path/to/library/src',
        main: 'monaco.contribution',
      },
    ],
    workers: [
      {
        name: 'workerMain.js',
        main: 'path/to/worker/main.ts',
        includes: [
          'path/to/first/worker/service.ts',
          'path/to/second/worker/service.ts',
        ],
      },
    ],
  },
}
```

In the above example, the compilation emits additional worker scripts that are loaded at runtime from the webpack `publicPath` directory.

This directory can be overridden at runtime by specifying the `MonacoEnvironment.baseUrl` global variable before the bundle script is loaded:

```html
<script>
  window.MonacoEnvironment = {
    baseUrl: 'path/to/worker/scripts'
  };
</script>
<script src="monaco/index.js"></script>
```

## Scenario 2: Bundling worker scripts into main output file (no additional server required):

```js
{
  loader: '@timkendrick/monaco-editor-loader',
  options: {
    workerOptions: {
      inline: true,
    },
    modules: [
      {
        name: 'vs',
        root: 'path/to/vscode/src',
      },
      {
        name: 'vs/extension/name',
        root: 'path/to/extension/src',
        main: 'monaco.contribution',
        include: true,
      },
      {
        name: 'vs/library/name',
        root: 'path/to/library/src',
        main: 'monaco.contribution',
      },
    ],
    workers: [
      {
        name: 'workerMain.js',
        main: 'path/to/worker/main.ts',
        includes: [
          'path/to/first/worker/service.ts',
          'path/to/second/worker/service.ts',
        ],
      },
    ],
  },
}
```

In the above example, worker scripts will be embedded within the main output bundle.

# Loader options

| Name | Type | Required | Default | Description |
| ----- | ---- | -------- | ------- | ----------- |
| `modules` | `Array<ModuleDefinition>` | No | `[]` | Paths to Monaco AMD module definition files |
| `workers` | `Array<WorkerDefinition>` | No | `[]` | Worker modules to be included in the compiled output |
| `workerOptions` | `object` | No | `{}` | Configuration options for worker scripts |
| `workerOptions.inline` | `boolean` | No | `false` | Whether to bundle worker scripts into the main bundle |
| `workerOptions.filename` | `string` | No | `"[hash].worker.js"` | Filename template for worker scripts |
| `workerOptions.baseUrl` | `string` | No | webpack `publicPath` | Base URL from which to load worker scripts at runtime |

## `ModuleDefinition`

| Name | Type | Required | Default | Description |
| ----- | ---- | -------- | ------- | ----------- |
| `name` | `string` | Yes | N/A | Visual Studio extension name |
| `root` | `string` | Yes | N/A | Path to extension source files |
| `main` | `string` | No | `undefined` | Path to extension entry point file, relative to `root` |
| `include` | `boolean` | No | `false` | Whether to include extension entry point in output bundle |

## `WorkerDefinition`

| Name | Type | Required | Default | Description |
| ----- | ---- | -------- | ------- | ----------- |
| `name` | `string` | Yes | N/A | Name of worker output script |
| `main` | `string` | Yes | N/A | Path to worker entry point file |
| `includes` | `Array<string>` | No | `[]` | List of additional service entry point files to bundle into worker script |
