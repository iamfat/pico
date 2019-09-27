# pico
Light-weight AMD JS loader for specific scene...

## Installation
```bash
yarn add 'git+https://github.com/iamfat/pico.git'
```

## How to use it?
```javascript
import { define, load } from 'pico'
define('YOUR_DEP_NAME1', YOUR_DEP_MODULE1)
define('YOUR_DEP_NAME2', YOUR_DEP_MODULE2)
// load some of your modules from browser-side
load([ 'url1', 'url2' ]).then((module1, module2) => {
    
})
```