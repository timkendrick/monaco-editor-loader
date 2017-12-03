/* eslint-env browser */
module.exports = function amd(config, assets) {
  const modules = {};

  function define(id, dependencies, factory) {
    if ((arguments.length < 2) || (arguments.length > 3) || (typeof id !== 'string')) {
      throw new Error('Invalid arguments passed to define()');
    }
    if (id in modules) { throw new Error(`Duplicate module definition: ${id}`); }
    modules[id] = (arguments.length === 3
      ? createModule(id, dependencies, factory)
      : () => dependencies
    );
  }

  return {
    define: Object.assign(define, {
      amd: true,
      import(importedModules) {
        Object.keys(importedModules).forEach((id) => {
          if (id in modules) {
            if (
              config.ignoreDuplicateModules &&
              (config.ignoreDuplicateModules.indexOf(id) !== -1)
            ) { return; }
            throw new Error(`Duplicate module definition: ${id}`);
          }
          modules[id] = importedModules[id];
        });
      },
      getModules() {
        return modules;
      },
    }),
    require: assignRequireApi(config, assets, undefined, (dependencies, factory) => (
      createModule(
        undefined,
        Array.isArray(dependencies) ? dependencies : [dependencies],
        factory
      )(loadModule)
    )),
  };

  function loadModule(scope, id) {
    const absoluteId = resolveModuleId(scope, id);
    if (absoluteId in modules) {
      const module = modules[absoluteId];
      const result = module(loadModule);
      modules[absoluteId] = () => result;
      return result;
    }
    if (id.indexOf('!') !== -1) {
      const [pluginId, moduleId] = id.split('!');
      const resolvedModuleId = resolveModuleId(scope, moduleId);
      const plugin = loadModule(id, pluginId);
      const pluginRequire = assignRequireApi(config, assets, resolvedModuleId,
        (dependencies, factory) => createModule(resolvedModuleId, dependencies, factory)(loadModule)
      );
      let result;
      plugin.load(resolvedModuleId, pluginRequire, (value) => { result = value; }, config);
      modules[absoluteId] = () => result;
      return result;
    }
    throw new Error(`Missing dependency: ${id}`);
  }

  function createModule(id, dependencies, factory) {
    return (loader) => {
      const exports = dependencies.indexOf('exports') !== -1 ? {} : undefined;
      const module = { exports };
      const injectedRequire = assignRequireApi(config, assets, id, (requirements, callback) => {
        if (callback) {
          callback(...requirements.map((requirement) => loader(id, requirement)));
        } else {
          return loader(id, requirements);
        }
      });
      const resolvedDependencies = dependencies.map((dependency) => {
        switch (dependency) {
          case 'exports': return exports;
          case 'module': return module;
          case 'require': return injectedRequire;
          default: return loader(id, dependency);
        }
      });
      const result = typeof factory === 'function' ? factory(...resolvedDependencies) : factory;
      return result || module.exports || exports;
    };
  }

  function resolveModuleId(scope, id) {
    if (!id) { return ''; }
    if (!id.startsWith('.')) { return id; }
    let scopePath = getParentPath(scope || '');
    let remainingPath = id;
    while (remainingPath.startsWith('./') || remainingPath.startsWith('../')) {
      if (remainingPath.startsWith('./')) {
        remainingPath = remainingPath.substr('./'.length);
      } else if (remainingPath.startsWith('../')) {
        scopePath = getParentPath(scopePath);
        remainingPath = remainingPath.substr('../'.length);
      }
    }
    return (scopePath ? `${scopePath}/` : '') + remainingPath;
  }

  function assignRequireApi(requireConfig, bundledAssets, moduleId, fn) {
    return Object.assign(fn, {
      globals: window,
      getConfig() {
        return requireConfig;
      },
      toUrl(name) {
        const path = resolveModuleId(moduleId, name);
        if (bundledAssets && (path in bundledAssets)) { return bundledAssets[path]; }
        const prefix = (!requireConfig.baseUrl || requireConfig.baseUrl.endsWith('/')
          ? requireConfig.baseUrl || ''
          : `${requireConfig.baseUrl}/`
        );
        return `${prefix}${path}`;
      },
      defined(name) {
        return resolveModuleId(moduleId, name) in modules;
      },
      specified(name) {
        return resolveModuleId(moduleId, name) in modules;
      },
    });
  }

  function getParentPath(id) {
    return id.split('/').slice(0, -1).join('/');
  }
};
