import map from '../settimeoutpolyfill/map';

export default function clearTimeoutPoly(id) {
    var obj = map.get(id);
    if ('undefined' !== typeof obj) {
        obj.invalid = true;
        map.delete(id);
    }
}
