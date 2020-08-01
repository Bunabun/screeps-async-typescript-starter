import { ErrorMapper } from "utils/ErrorMapper";
import { AsyncLoop } from "utils/AsyncLoop";

let bool = false;

const asyncLoop = AsyncLoop.wrapLoop(async (time) => {
  // Game.time might increment within the loop if a Promise resolves at a later time.
  // As help, time is passed internally at the start of the loop and remains the same throughout its runtime
  console.log(`Current asynchronous game tick is ${time}`);
  if (bool) return;
  bool = true;

  var p = (async () => {
    console.log("Resolving promise.");
    return PromisePoly.resolve("Resolved promise");
  })();

  await PromisePoly._delay(2);

  console.log(`${await p} after two ticks.`);
});

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  console.log(`Current game tick is ${Game.time}`);
  // run asynchronous loop
  asyncLoop();
});
