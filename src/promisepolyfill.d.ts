declare namespace PromisePolyfill {
    interface PromisePolyfillConstructor extends PromiseConstructor {
        _immediateFn<T>(handler: (() => void) | string, value: T | PromiseLike<T>): void;
        __callbacks__: { _ticks: number, _fn: Function }[];
        __futureCallbacks__: { _ticks: number, _fn: Function }[];

        _delay(ticks: number): Promise<void>;
    }
}

declare const PromisePoly: PromisePolyfill.PromisePolyfillConstructor;
