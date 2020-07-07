const global = window as any;
const parsedDefs = {} as { [name: string]: { deps: string[]; factory: any; src: string; loaded: boolean } };
const loadListeners = {} as { [name: string]: Function[] };
const loadedScripts = {} as { [name: string]: boolean };

function define(name, deps, factory?) {
    //Allow for anonymous modules
    if (typeof name !== 'string') {
        //Adjust args appropriately
        factory = deps;
        deps = name;
        name = undefined;
    }

    //This module may not have dependencies
    if (!Array.isArray(deps)) {
        factory = deps;
        deps = undefined;
    }

    const src = document.currentScript && (document.currentScript as HTMLScriptElement).src;

    name = name || src;
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
    let promises = names.map(
        (name) =>
            new Promise((resolve, reject) => {
                if (name.charAt(0) === '!') {
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
                            const defName = Object.keys(parsedDefs).find((k) => parsedDefs[k].src === script.src);
                            if (defName === undefined) {
                                reject(`module:${name} missing!`);
                            }
                            _load(defName).then(resolve).catch(reject);
                        });
                        script.src = name;
                        script.async = true;
                        document.body.appendChild(script);
                        loadedScripts[name] = true;
                    } else {
                        reject('Your browser is too OLD to run "pico" loader');
                    }
                }
            }),
    );

    return promises.length > 1 ? Promise.all(promises) : promises[0];
}

function load(...names) {
    if (!global.define) {
        global.define = define;
    } else if (!global.define.amd || !global.define.amd.pico) {
        throw new Error('Incompatible mix of defines found!');
    }
    return _load(...names);
}

export { load, define };
