import PromisePoly from "./polyfills/promisepolyfill";
import { ErrorMapper } from "utils/ErrorMapper";
import { AsyncLoop } from "utils/AsyncLoop";

let bool = false;

// promise resolves in three ticks
async function delayFn() {
  // occurs synchronous
  console.log("Resolving promise.");
  await PromisePoly.delay(1);
  await PromisePoly.delay(1);
  await PromisePoly.delay(1);
  return "Resolved promise";
}

let p:any = null;

const asl = new AsyncLoop();

async function mainAsync() {
  // yield to make async immediately
  await PromisePoly.yield();
  // let the promise run in the background
  p = delayFn().configureQuota(5);
  // initiate an interval to print every four ticks
  setInterval(() => { console.log("Scheduled task"); }, 4);

  // wait for the promise to finish
  console.log(`${await p}`);
  console.log(`after three ticks.`);
};

asl.usedCpuFn = (index) => index;
asl.quotaFn = () => 100;

const wrappedLoop = asl.wrapAsyncLoop(async (time) => {
  // Game.time might increment within an async function if a the function's continuation happens on the next tick.
  // As help, time is passed internally at the start of the tick and remains the same throughout the async function's runtime.
  console.log(`Current asynchronous game tick is ${time}`);

  if (bool) return;
  bool = true;

  let mainPromise = mainAsync();
  mainPromise.configureQuota(20);
  await mainPromise;
});

for (let index = 0; index < 20; index++) {
  wrappedLoop();
}

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  console.log(`Current game tick is ${Game.time}`);
  // run asynchronous loop
  wrappedLoop();
});
