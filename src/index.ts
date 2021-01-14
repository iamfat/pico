type PicoConfig = {
    paths: ((name: string) => string) | { [name: string]: string };
    enableRequire: boolean;
};

const picoConfig: PicoConfig = {
    paths: {},
    enableRequire: false,
};

const isFunction = (x) => typeof x === 'function';
const isString = (x) => typeof x === 'string';
const isArray = (x) => (Array.isArray ? Array.isArray(x) : typeof x === 'object' && x.hasOwnProperty('length'));

const global = window as any;

const parsedDefs = {} as { [name: string]: { deps: string[]; factory: any; src: string; loaded: boolean } };
const loadListeners = {} as { [name: string]: Function[] };
const loadedScripts = {} as { [name: string]: string };

function getModuleSrc(name: string): string {
    if (isFunction(picoConfig.paths)) {
        return (picoConfig.paths as Function)(name);
    }
    return picoConfig.paths[name] || name;
}

function define(name, deps, factory?) {
    //Allow for anonymous modules
    if (isString(name)) {
        //Adjust args appropriately
        factory = deps;
        deps = name;
        name = undefined;
    }

    //This module may not have dependencies
    if (isArray(deps)) {
        factory = deps;
        deps = undefined;
    }

    const src = document.currentScript && (document.currentScript as HTMLScriptElement).src;
    if (!name) {
        name = Object.keys(loadedScripts).find((k) => loadedScripts[k] === src);
    }

    if (!name) {
        name = src;
    }

    if (name) {
        parsedDefs[name] = { deps, factory, src, loaded: false };
        if (loadListeners[name]) {
            loadListeners[name].map((l) => l());
            delete loadListeners[name];
        }
    }
}

// Define function complies with a basic subset of the AMD API
define.amd = {
    pico: true,
};

function _load(...names: string[]) {
    let promises = names.map((name) => {
        return new Promise((resolve, reject) => {
            if (name.charAt(0) === '!') {
                // force to reload module whose name begins with !
                name = name.slice(1);
                delete parsedDefs[name];
                delete loadedScripts[name];
            }
            if (parsedDefs[name]) {
                const def = parsedDefs[name];
                if (def.loaded) {
                    resolve(def.factory);
                } else if (typeof def.factory === 'function') {
                    let depPromise;
                    if (def.deps) {
                        depPromise = _load(...def.deps);
                    } else {
                        depPromise = Promise.resolve([]);
                    }
                    depPromise
                        .then((depModules) => {
                            if (!Array.isArray(depModules)) depModules = [depModules];
                            def.factory = def.factory(...depModules);
                            def.loaded = true;
                            resolve(def.factory);
                        })
                        .catch(reject);
                } else {
                    def.loaded = true;
                    resolve(def.factory);
                }
            } else if (/^\w+$/.test(name)) {
                loadListeners[name] = loadListeners[name] || [];
                loadListeners[name].push(() => {
                    _load(name).then(resolve).catch(reject);
                });
            } else if (!loadedScripts[name]) {
                const script = document.createElement('script');
                if (typeof script.addEventListener !== 'undefined') {
                    script.addEventListener('load', () => {
                        const defName = Object.keys(parsedDefs).find((k) => {
                            return parsedDefs[k].src === script.src;
                        });
                        if (defName === undefined) {
                            reject(`module:${name} missing!`);
                        }
                        _load(defName).then(resolve).catch(reject);
                        document.body.removeChild(script);
                    });
                    script.src = getModuleSrc(name);
                    script.async = true;
                    document.body.appendChild(script);
                    loadedScripts[name] = script.src;
                } else {
                    reject('Your browser is too OLD to run "pico" loader');
                }
            }
        });
    });

    return promises.length > 1 ? Promise.all(promises) : promises[0];
}

function require(deps, callback) {
    _load(deps).then((m: any[]) => callback(...m));
}

function init() {
    if (!global.define) {
        global.define = define;
    } else if (!global.define.amd || !global.define.amd.pico) {
        throw new Error('Incompatible mix of defines found!');
    }

    if (picoConfig.enableRequire) {
        if (global.require === undefined) {
            global.require = require;
        } else if (global.require !== require) {
            throw new Error('Failed to enable global "require" since other version exists!');
        }
    } else if (global.require === require) {
        global.require = undefined;
    }
}

function load(...names) {
    init();
    return _load(...names);
}

function config(conf?: PicoConfig) {
    if (conf !== undefined) {
        if (conf.paths !== undefined) {
            picoConfig.paths = conf.paths;
        }
        if (conf.enableRequire !== undefined) picoConfig.enableRequire = !!conf.enableRequire;
        // load config immediately
        init();
    }
    return picoConfig;
}

export { load, define, config };
