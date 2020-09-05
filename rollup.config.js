"use strict";

import clear from 'rollup-plugin-clear';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import inject from '@rollup/plugin-inject';
import path from 'path';

let cfg;
const dest = process.env.DEST;
const outputFile = "dist/main.js";
if (!dest) {
  console.log("No destination specified - code will be compiled but not uploaded");
} else if ((cfg = require("./screeps.json")[dest]) == null) {
  throw new Error("Invalid upload destination");
}

export default {
  input: "src/main.ts",
  output: {
    file: outputFile,
    format: "cjs",
    sourcemap: true
  },

  plugins: [
    clear({ targets: ["dist"] }),
    resolve({ browser: true, preferBuiltins: false }),
    commonjs(),
    typescript({tsconfig: "./tsconfig.json", clean: true}),
    inject({
      Promise: path.resolve('src/polyfills/promisepolyfill/index.js'),
      setInterval: path.resolve('src/polyfills/setintervalpolyfill/index.js'),
      setTimeout: path.resolve('src/polyfills/settimeoutpolyfill/index.js'),
      clearInterval: path.resolve('src/polyfills/clearintervalpolyfill/index.js'),
      clearTimeout: path.resolve('src/polyfills/cleartimeoutpolyfill/index.js')
    })
  ]
}
