import map from './map';
import clearTimeout from '../cleartimeoutpolyfill';
var incrementId = 0;
export default function setTimeoutPoly(callback, ticks, args) {
    var obj = {};
    obj._ticks = ticks;
    obj._fn = { fn: callback, args: args, clearCallback: clearTimeout, id: ++incrementId };

    map.set(incrementId, obj);

    var callbacks = Promise.__futureCallbacks__;
    callbacks.push(obj);

    return incrementId;
}
