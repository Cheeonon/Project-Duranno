/* global __dirname */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function harness(file, modules) {
  let index = 0;
  const slots = [];
  let effects = [];
  const react = {
    useState(initial) {
      const key = index++;
      if (!(key in slots)) slots[key] = typeof initial === 'function' ? initial() : initial;
      return [slots[key], (next) => { slots[key] = typeof next === 'function' ? next(slots[key]) : next; }];
    },
    useRef(initial) {
      const key = index++;
      return slots[key] ??= { current: initial };
    },
    useCallback(callback, deps) {
      const key = index++;
      const old = slots[key];
      if (!old || deps.some((dep, i) => !Object.is(dep, old.deps[i]))) {
        slots[key] = { callback, deps };
      }
      return slots[key].callback;
    },
    useEffect(effect, deps) {
      const key = index++;
      const old = slots[key];
      if (!old || deps.some((dep, i) => !Object.is(dep, old.deps[i]))) {
        slots[key] = { deps, cleanup: old?.cleanup };
        effects.push(() => {
          slots[key].cleanup?.();
          slots[key].cleanup = effect();
        });
      }
    },
    createContext() {
      const context = {};
      context.Provider = { context };
      return context;
    },
    useContext(context) { return context.value; },
  };
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(source, {
    exports, require(name) {
      if (name === 'react') return react;
      if (name === 'react/jsx-runtime') {
        const jsx = (type, props) => {
          if (type.context) type.context.value = props.value;
          return { type, props };
        };
        return { jsx, jsxs: jsx };
      }
      if (name in modules) return modules[name];
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  return {
    exports,
    render(callback) {
      index = 0;
      const result = callback();
      const pending = effects;
      effects = [];
      pending.forEach((run) => run());
      return result;
    },
  };
}
module.exports = { harness };
