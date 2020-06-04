const global = window as any;
const loadedModules = [] as any;

function define(name, deps, factory?) {
  //Allow for anonymous modules
  if (typeof name !== "string") {
    //Adjust args appropriately
    factory = deps;
    deps = name;
    name = null;
  }

  //This module may not have dependencies
  if (deps instanceof Array === false) {
    factory = deps;
    deps = null;
  }

  loadedModules.push({ name, deps, factory });
}

// Define function complies with a basic subset of the AMD API
define.amd = {
  pico: true,
};

function load(...moduleUris: string[]) {
  const promises = moduleUris.map((moduleUri) => {
    return new Promise((resolve, reject) => {
      if (!global.define) {
        global.define = define;
      } else if (!global.define.amd || !global.define.amd.pico) {
        reject("Incompatible mix of defines found!");
      }
      // Create a script for feature detection & potentially loading with.
      const script = document.createElement("script");
      if (typeof script.addEventListener !== "undefined") {
        script.addEventListener("load", () => {
          const module = loadedModules.pop();
          if (typeof module.factory === "function") {
            if (module.deps instanceof Array) {
              Promise.all(
                module.deps.map((depName) => {
                  const depModules = loadedModules.filter(
                    ({ name }) => name === depName
                  );
                  if (depModules.length === 0) {
                    return load(depName);
                  } else {
                    const module = depModules[0];
                    if (typeof module.factory === "function") {
                      return module.factory();
                    } else {
                      return module.factory;
                    }
                  }
                })
              ).then((depModules) => {
                resolve(module.factory(...depModules));
              });
            } else {
              resolve(module.factory());
            }
          } else {
            resolve(module.factory);
          }
        });
        script.src = moduleUri as string;
        script.async = true;
        document.body.appendChild(script);
      } else {
        reject('Your browser is too OLD to run "pico" loader');
      }
    });
  });
  return promises.length > 1 ? Promise.all(promises) : promises[0];
}

const pico = { load, define };
export { load, define };
export default pico;
