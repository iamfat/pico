import { terser } from "rollup-plugin-terser";
import typescript from "@rollup/plugin-typescript";
import pkg from "./package.json";

const dependencies = Object.assign(
  {},
  pkg.dependencies || {},
  pkg.peerDependencies || {}
);

const external = Object.keys(dependencies);

export default {
  input: "src/index.ts",
  output: [
    {
      name: "pico",
      dir: 'lib',
      format: "cjs",
      exports: "named",
    },
  ],
  external,
  plugins: [typescript(), terser()],
};
