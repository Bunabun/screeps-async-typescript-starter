import map from './map';
var incrementId = 0;
export default function setIntervalPoly(callback, ticks, args) {
    var obj = {};
    obj._ticks = ticks;
    obj._fn = { fn: callback, args: args, rep: ticks, id: ++incrementId };

    map.set(incrementId, obj);

    var callbacks = Promise.__futureCallbacks__;
    callbacks.push(obj);
}
