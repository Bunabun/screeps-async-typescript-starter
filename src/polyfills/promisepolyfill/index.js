/**
 * @this {PromisePoly}
 */
function finallyConstructor(callback) {
  var constructor = this.constructor;
  return this.then(
    function (value) {
      // @ts-ignore
      return constructor.resolve(callback()).then(function () {
        return value;
      });
    },
    function (reason) {
      // @ts-ignore
      return constructor.resolve(callback()).then(function () {
        // @ts-ignore
        return constructor.reject(reason);
      });
    }
  );
}

function isArray(x) {
  return Boolean(x && typeof x.length !== 'undefined');
}

function noop() { }

// Polyfill for Function.prototype.bind
function bind(fn, thisArg) {
  return function () {
    fn.apply(thisArg, arguments);
  };
}

var id = 0;
/**
 * @constructor
 * @param {Function} fn
 */
function PromisePoly(fn) {
  if (!(this instanceof PromisePoly))
    throw new TypeError('Promises must be constructed via new');
  if (typeof fn !== 'function') throw new TypeError('not a function');
  /** @type {!number} */
  this._state = 0;
  /** @type {!boolean} */
  this._handled = false;
  /** @type {PromisePoly|undefined} */
  this._value = undefined;
  /** @type {!Array<!Function>} */
  this._deferreds = [];
  /** @type {Function|number|undefined} */
  this._quotaPredicate = undefined;
  this._id = id++;

  doResolve(fn, this);
}

function handle(self, deferred) {
  while (self._state === 3) {
    self = self._value;
  }
  if (self._state === 0) {
    self._deferreds.push(deferred);
    return;
  }
  self._handled = true;

  var fn = function () {
    var cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected;
    if (cb === null) {
      (self._state === 1 ? resolve : reject)(deferred.promise, self._value);
      return;
    }
    var ret;
    try {
      ret = cb(self._value);
    } catch (e) {
      reject(deferred.promise, e);
      return;
    }
    resolve(deferred.promise, ret);
  };
  PromisePoly._immediateFn(fn, self._quotaPredicate);
}

function resolve(self, newValue) {
  try {
    // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
    if (newValue === self)
      throw new TypeError('A promise cannot be resolved with itself.');
    if (
      newValue &&
      (typeof newValue === 'object' || typeof newValue === 'function')
    ) {
      var then = newValue.then;
      if (newValue instanceof PromisePoly) {
        self._state = 3;
        self._value = newValue;
        finale(self);
        return;
      } else if (typeof then === 'function') {
        doResolve(bind(then, newValue), self);
        return;
      }
    }
    self._state = 1;
    self._value = newValue;
    finale(self);
  } catch (e) {
    reject(self, e);
  }
}

function reject(self, newValue) {
  self._state = 2;
  self._value = newValue;
  finale(self);
}

function finale(self) {
  if (self._state === 2 && self._deferreds.length === 0) {
    var fn = function () {
      if (!self._handled) {
        PromisePoly._unhandledRejectionFn(self._value);
      }
    };

    PromisePoly._immediateFn(fn);
  }

  for (var i = 0, len = self._deferreds.length; i < len; i++) {
    handle(self, self._deferreds[i]);
  }

  self._deferreds = null;
}

/**
 * @constructor
 */
function Handler(onFulfilled, onRejected, promise) {
  this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
  this.onRejected = typeof onRejected === 'function' ? onRejected : null;
  this.promise = promise;
}

/**
 * Take a potentially misbehaving resolver function and make sure
 * onFulfilled and onRejected are only called once.
 *
 * Makes no guarantees about asynchrony.
 */
function doResolve(fn, self) {
  var done = false;
  try {
    fn(
      function (value) {
        if (done) return;
        done = true;
        resolve(self, value);
      },
      function (reason) {
        if (done) return;
        done = true;
        reject(self, reason);
      }
    );
  } catch (ex) {
    if (done) return;
    done = true;
    reject(self, ex);
  }
}

PromisePoly.prototype['catch'] = function (onRejected) {
  return this.then(null, onRejected);
};

PromisePoly.prototype.then = function (onFulfilled, onRejected) {
  // @ts-ignore
  var prom = new this.constructor(noop);

  handle(this, new Handler(onFulfilled, onRejected, prom));
  return prom;
};

PromisePoly.prototype['finally'] = finallyConstructor;

PromisePoly.prototype.configureQuota = function (predicate) {
  if (predicate === false) {
    this._quotaPredicate = undefined;
  } else if (typeof predicate === "function" || typeof predicate === "number") {
    this._quotaPredicate = predicate;
  }

  return this;
}

PromisePoly.all = function (arr) {
  return new PromisePoly(function (resolve, reject) {
    if (!isArray(arr)) {
      return reject(new TypeError('Promise.all accepts an array'));
    }

    var args = Array.prototype.slice.call(arr);
    if (args.length === 0) return resolve([]);
    var remaining = args.length;

    function res(i, val) {
      try {
        if (val && (typeof val === 'object' || typeof val === 'function')) {
          var then = val.then;
          if (typeof then === 'function') {
            then.call(
              val,
              function (val) {
                res(i, val);
              },
              reject
            );
            return;
          }
        }
        args[i] = val;
        if (--remaining === 0) {
          resolve(args);
        }
      } catch (ex) {
        reject(ex);
      }
    }

    for (var i = 0; i < args.length; i++) {
      res(i, args[i]);
    }
  });
};

PromisePoly.resolve = function (value) {
  if (value && typeof value === 'object' && value.constructor === PromisePoly) {
    return value;
  }

  return new PromisePoly(function (resolve) {
    resolve(value);
  });
};

PromisePoly.reject = function (value) {
  return new PromisePoly(function (resolve, reject) {
    reject(value);
  });
};

PromisePoly.race = function (arr) {
  return new PromisePoly(function (resolve, reject) {
    if (!isArray(arr)) {
      return reject(new TypeError('Promise.race accepts an array'));
    }

    for (var i = 0, len = arr.length; i < len; i++) {
      PromisePoly.resolve(arr[i]).then(resolve, reject);
    }
  });
};

PromisePoly.__callbacks__ = [];
PromisePoly.__futureCallbacks__ = [];
PromisePoly._immediateFn = function (fn, predicate, ticks) {
  var obj = {
    _fn: fn,
    _ticks: ticks,
    _predicate: predicate
  };

  if (ticks > 0) {
    PromisePoly.__futureCallbacks__.push(obj);
  } else {
    PromisePoly.__callbacks__.push(obj);
  }
};

PromisePoly.delay = function (ticks) {
  return new PromisePoly(function (resolve) {
    PromisePoly._immediateFn(function () {
      resolve(null);
    }, undefined, ticks);
  });
};

PromisePoly.yield = function (ticks) {
  return PromisePoly.delay(0);
};

PromisePoly._setUnhandledRejectionFn = function (fn) {
  if (fn && (typeof fn === "function" && fn.length >= 1)) {
    PromisePoly._unhandledRejectionFn = fn;
  }
}

PromisePoly._unhandledRejectionFn = function (err) {
  if (typeof console !== 'undefined' && console) {
    console.warn('Possible Unhandled Promise Rejection:', err); // eslint-disable-line no-console
  }
};

export default PromisePoly;
