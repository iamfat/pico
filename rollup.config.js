import { terser } from 'rollup-plugin-terser'
import pkg from './package.json'

const dependencies = Object.assign(
  {},
  pkg.dependencies || {},
  pkg.peerDependencies || {}
)

// mobx should be imported from external
// delete dependencies['mobx']
// hash_sum should be compiled inline
delete dependencies['hash-sum']

const external = Object.keys(dependencies)

export default {
  input: 'src/index.js',
  output: [
    {
      name: 'pico',
      file: pkg.main,
      format: 'cjs',
      exports: 'named'
    }
  ],
  external,
  plugins: [
    terser()
  ]
}
