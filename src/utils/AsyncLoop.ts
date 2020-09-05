import PromisePoly from "../polyfills/promisepolyfill";

export class AsyncLoop {
    private _usedCpuFn: (index: number) => number = (index) => Game.cpu.getUsed();
    private _quotaFn: (index: number) => number = (index) => Game.cpu.tickLimit - this._epsilon;
    private _logFn: (str: any) => void = (str) => console.log(str);
    private _epsilon: number = 10;

    private _standInTime: number = 0;

    public set usedCpuFn(fn: (index: number) => number) {
        this._usedCpuFn = fn;
    }

    public set quotaFn(fn: (index: number) => number) {
        this._quotaFn = fn;
    }

    public set logFn(fn: (str: string) => void) {
        this._logFn = fn;
    }

    public set epsilon(value: number) {
        this._epsilon = value;
    }

    public wrapAsyncLoop(asyncLoop: (time: number) => Promise<void> | void): () => void {
        return () => {
            let callbacks = PromisePoly.__callbacks__;
            let futureCallbacks = PromisePoly.__futureCallbacks__;

            let index = this.runCallbacks(callbacks);

            callbacks = callbacks.slice(index);
            let curr = futureCallbacks
                .map((value) => { // map future call backs reducing the tick by one
                    return { _ticks: value._ticks - 1, _fn: value._fn, _predicate: value._predicate }
                });

            let now = curr.filter((value) => value._ticks === 0);
            let future = curr.filter((value) => value._ticks > 0);

            callbacks.unshift(...now);
            PromisePoly.__callbacks__ = callbacks;
            PromisePoly.__futureCallbacks__ = future;
            asyncLoop("undefined" === typeof Game ? this._standInTime++ : Game.time);
        };
    }

    private runCallbacks(callbacks: any[]) {
        let index: number;
        let deferred: number = 0;

        for (index = 0; index < callbacks.length; index++) {
            if (this._usedCpuFn(index) > this._quotaFn(index)) {
                this._logFn(`Warning exceeded cpu quota. Callback count: ${PromisePoly.__callbacks__.length}`);
                break;
            }

            const fn = callbacks[index]._fn;

            // normal function
            if (typeof fn === "function") {
                if (this.resolvePredicate(callbacks[index]._predicate, index)) {
                    // run function
                    // reset deferred count
                    deferred = 0;
                    fn();
                } else {
                    // push the function to the end of the stack and rollback index by one
                    callbacks.push(callbacks.splice(index, 1)[0]);
                    deferred++;
                    if (deferred === callbacks.length) {
                        break;
                    }
                    index--;
                }
            }
            // packaged function
            else {
                if ("undefined" === typeof Game || "sim" in Game.rooms) {
                    // this._logFn(`Warning using timeout or interval has undefined behaviours in a sim env. An error is likely to occur.`);
                }
                // unpack function
                let obj:any = fn;
                // check if invalidated by remove
                if (!obj.invalid) {
                    // var currentTick = "undefined" === typeof Game ? 0 : Game.time;
                    obj.fn(obj.args);
                    if (obj.rep)
                    {
                        // fn could have been an async function and could have been deferred to the next tick.
                        // var elapsed = Game.time - currentTick;
                        // another check is needed
                        if (!obj.invalid) {
                            // var timeout = obj.rep - elapsed;
                            // if (timeout <= 0) {
                            //     // run fn immediately
                            //     obj.fn(obj.args);
                            // }
                            // reset timeout and add it back to the call stack
                            // @ts-ignore
                            PromisePoly.__futureCallbacks__.push({ _ticks: obj.rep, _fn: obj });
                        }
                    }
                }

                // regardless if the function ran or not check if a timeout clearing is needed
                if (obj.clearCallback) {
                    obj.clearCallback(obj.id);
                }
            }
        }

        return index;
    }

    private resolvePredicate(predicate: any, index: number) {
        switch (typeof predicate) {
            case "function":
                var result = predicate(index);
                switch (typeof result)
                {
                    case "boolean":
                        return result;
                    case "number":
                        return this._usedCpuFn(index) < result
                    default: return false
                }
            case "number":
                return this._usedCpuFn(index) < predicate
            default: return true;
        }
    }
}
