// @ts-ignore
import PromisePoly from "promisepolyfill";

export class AsyncLoop {
    private static _usedCpuFn: (index: number) => number = (index) => Game.cpu.getUsed();
    private static _quotaFn: (index: number) => number = (index) => 450;
    private static _logFn: (str: any) => void = (str) => console.log(str);

    public static set usedCpuFn(fn: (index: number) => number) {
        this._usedCpuFn = fn;
    }

    public static set quotaFn(fn: (index: number) => number) {
        this._quotaFn = fn;
    }

    public static set logFn(fn: (str: string) => void) {
        this._logFn = fn;
    }

    public static wrapLoop(asyncLoop: (time: number) => void): () => void {
        return () => {
            let callbacks = PromisePoly.__callbacks__;
            let futureCallbacks = PromisePoly.__futureCallbacks__;

            let index;
            for (index = 0; index < callbacks.length; index++) {
                if (this._usedCpuFn(index) > this._quotaFn(index)) {
                    this._logFn(`Warning exceeded cpu quota. Callback count: ${PromisePoly.__callbacks__.length}`);
                    break;
                }
                const fn = callbacks[index]._fn;
                fn();
            }

            callbacks = callbacks.slice(index);
            var curr = futureCallbacks
                .map((value: { _ticks: number; _fn: any; }) => { // map future call backs reducing the tick by one
                    return { _ticks: value._ticks - 1, _fn: value._fn }
                });

            var now = curr.filter((value: { _ticks: number; }) => value._ticks === 0);
            var future = curr.filter((value: { _ticks: number; }) => value._ticks > 0);

            callbacks.unshift(...now);
            PromisePoly.__callbacks__ = callbacks;
            PromisePoly.__futureCallbacks__ = future;
            asyncLoop("undefined" === typeof Game ? 0 : Game.time);
        };
    }
}
