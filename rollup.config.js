import { terser } from 'rollup-plugin-terser';
import typescript from '@rollup/plugin-typescript';
import pkg from './package.json';

const dependencies = Object.assign({}, pkg.dependencies || {}, pkg.peerDependencies || {});

const external = Object.keys(dependencies);

export default [
    {
        input: 'src/index.ts',
        output: {
            name: 'pico',
            dir: 'lib',
            format: 'cjs',
            exports: 'named',
            sourcemap: true,
        },
        external,
        plugins: [typescript({ outDir: 'lib', declaration: true }), terser()],
    },
    {
        input: 'src/index.ts',
        output: {
            name: 'pico',
            file: 'lib/index.mjs',
            format: 'esm',
            exports: 'named',
            sourcemap: true,
        },
        external,
        plugins: [typescript(), terser()],
    },
];
