"use strict";

import clear from 'rollup-plugin-clear';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import inject from '@rollup/plugin-inject';
import fs from 'fs';

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
      PromisePoly: 'promisepolyfill'
    }),
    {
      writeBundle({file}) {
        if (file === outputFile) {
          fs.readFile(file, 'utf8', function (err,data) {
            if (err) {
              return console.log(err);
            }
            var result = data.replace(/P = Promise/g, 'P = PromisePoly');

            fs.writeFile(file, result, 'utf8', function (err) {
               if (err) return console.log(err);
            });
          });
        }
      }
    }
  ]
}
