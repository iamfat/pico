const global = window
const loadedModules = []

const define = (name, deps, factory) => {
  //Allow for anonymous modules
  if (typeof name !== 'string') {
    //Adjust args appropriately
    factory = deps
    deps = name
    name = null
  }

  //This module may not have dependencies
  if (deps instanceof Array === false) {
    factory = deps
    deps = null
  }

  loadedModules.push({ name, deps, factory })
}

const load = moduleUri => {
  return new Promise((resolve, reject) => {
    if (!global.define) {
      global.define = define
    } else if (!global.define.amd || !global.define.amd.pico) {
      reject('Incompatible mix of defines found!')
    }
    // Create a script for feature detection & potentially loading with.
    var script = document.createElement('script')
    if (typeof script.addEventListener !== 'undefined') {
      script.addEventListener('load', () => {
        const module = loadedModules.pop()
        if (typeof module.factory === 'function') {
          if (module.deps instanceof Array) {
            Promise.all(
              module.deps.map(depName => {
                const depModules = loadedModules.filter(
                  ({ name }) => name === depName
                )
                if (depModules.length === 0) {
                  return load(depName)
                } else {
                  const module = depModules[0]
                  if (typeof module.factory === 'function') {
                    return module.factory()
                  } else {
                    return module.factory
                  }
                }
              })
            ).then(depModules => {
              resolve(module.factory(...depModules))
            })
          } else {
            resolve(module.factory())
          }
        } else {
          resolve(module.factory)
        }
      })
      script.src = moduleUri
      script.async = 'async'
      document.body.appendChild(script)
    } else {
      reject('Your browser is too OLD to run "pico" loader')
    }
  })
}

// Define function complies with a basic subset of the AMD API
define.amd = {
  pico: true
}

export { load, define }
export default { load, define }
