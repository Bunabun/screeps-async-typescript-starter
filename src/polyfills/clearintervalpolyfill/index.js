import { map } from '../setintervalpolyfill/map';

export default function clearIntervalPoly(id) {
    var obj = map.get(id);
    if ('undefined' !== typeof obj) {
        obj.invalid = true;
        map.delete(id);
    }
}
