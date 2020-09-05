declare interface PromisePolyfillConstructor extends PromiseConstructor {
    __callbacks__: { _ticks: number, _fn: Function, _predicate:any }[];
    __futureCallbacks__: { _ticks: number, _fn: Function, _predicate:any }[];
    _setUnhandledRejectionFn(fn: Function): void;

    delay(ticks: number): Promise<void>;
    yield(): Promise<void>
}

declare const PromisePoly: PromisePolyfillConstructor

export = PromisePoly;
