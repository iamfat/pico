# pico

Light-weight AMD JS loader for specific scene...

## Installation

```bash
yarn add 'git+https://github.com/iamfat/pico.git'
```

## How to use it?

```javascript
import * as pico from 'pico';
pico.config({
    paths: {
        'your-module-name': 'http://path/to/your-module.js',
    },
    enableRequire: false, // implements window.require if true
});

const oldConfig = pico.config();
pico.config({
    paths: (name) => {
        return `http://path/to/${name}`;
    }
});

pico.define('YOUR_DEP_NAME1', YOUR_DEP_MODULE1);
pico.define('YOUR_DEP_NAME2', YOUR_DEP_MODULE2);
// load some of your modules from browser-side
pico.load('url1', 'url2').then(([module1, module2]) => {});
```
