const global = window as any;
const loadedDefs = {} as { [name: string]: any };

let justLoaded: { name?: string; deps?: string[]; factory: any };
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

    if (name) {
        loadedDefs[name] = { deps, factory };
    } else {
        justLoaded = { name, deps, factory };
    }
}

// Define function complies with a basic subset of the AMD API
define.amd = {
    pico: true,
};

function _load(...names: string[]) {
    let promise = Promise.resolve(true);
    let modules: any[] = [];
    names.forEach((name) => {
        promise = promise.then(
            () =>
                new Promise((resolve, reject) => {
                    if (loadedDefs[name]) {
                        const def = loadedDefs[name];
                        if (typeof def.factory === 'function') {
                            let depPromise = Promise.resolve(true);
                            let depModules: any[] = [];
                            def.deps &&
                                def.deps.forEach((dep) => {
                                    depPromise = depPromise.then<any>(() =>
                                        _load(dep).then((m) => {
                                            depModules.push(m);
                                        }),
                                    );
                                });
                            depPromise
                                .then(() => {
                                    modules.push((def.factory = def.factory(...depModules)));
                                    resolve();
                                })
                                .catch(reject);
                        } else {
                            modules.push(def.factory);
                            resolve();
                        }
                    } else {
                        // Create a script for feature detection & potentially loading with.
                        const script = document.createElement('script');
                        if (typeof script.addEventListener !== 'undefined') {
                            script.addEventListener('load', () => {
                                if (justLoaded === undefined) {
                                    reject(`${name} was loaded but no define()!`);
                                }
                                loadedDefs[name] = justLoaded;
                                justLoaded = undefined;
                                _load(name)
                                    .then((m) => {
                                        modules.push(m);
                                        resolve();
                                    })
                                    .catch(reject);
                            });
                            script.src = name;
                            script.async = true;
                            document.body.appendChild(script);
                        } else {
                            reject('Your browser is too OLD to run "pico" loader');
                        }
                    }
                }),
        );
    });

    return promise.then(() => {
        return modules.length > 1 ? modules : modules[0];
    });
}

function load(...names) {
    if (!global.define) {
        global.define = define;
    } else if (!global.define.amd || !global.define.amd.pico) {
        throw new Error('Incompatible mix of defines found!');
    }
    return _load(...names);
}

const pico = { load, define };
export { load, define };
export default pico;
