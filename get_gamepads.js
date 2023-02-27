const WRAPPED = Symbol('WRAPPED');
function makeGetGamepads(navigator) {
  const oldGetGamepads = navigator.getGamepads.bind(navigator);
  let length = 4;

  const proxyGamepad = (gamepad) => new Proxy(gamepad, {
    get(target, prop) {
      if (prop === WRAPPED) return true;
      return target[prop];
    }
  });

  const getItem = (i) => {
    const gp = oldGetGamepads()[i];
    return gp ? proxyGamepad(gp) : undefined;
  };

  const makeIterator = () => {
    let index = 0;
    const iterator = {
      next() {
        const done = index >= length;
        return {
          done,
          value: done ? undefined : getItem(index++)
        };
      },
      [Symbol.iterator]: () => iterator
    };

    return iterator;
  };

  const isArrayIndex = function(p) {
    /* an array index is a property such that
       ToString(ToUint32(p)) === p and ToUint(p) !== 2^32 - 1 */
    const uint = p >>> 0;
    const s = uint + "";
    return p === s && uint !== 0xffffffff;
  };

  const proxy = new Proxy([], {
    set: () => false,
    get(target, prop, receiver) {
      if (prop === WRAPPED) return true;
      //if (prop === Symbol.iterator) return makeIterator();
      if (prop === "length") return length;
      if (isArrayIndex(prop) && prop < length) return getItem(prop);
      return target[prop];
    },
    has: (target, prop) =>
      prop === Symbol.iterator
      || prop === "length"
      || (isArrayIndex(prop) && prop < length)
      || target[prop]
  });

  const getGamepads = () => proxy;
  getGamepads[WRAPPED] = true;
  getGamepads.proxyGamepad = proxyGamepad;

  return getGamepads;
}

window.navigator.getGamepads = makeGetGamepads(window.navigator);

for (const type of ["gamepadconnected", "gamepaddisconnected"]) {
  window.addEventListener(type, (e) => {
    if (e.gamepad[WRAPPED]) return;

    e.stopImmediatePropagation();
    const event = new Event(type);
    event.gamepad = window.navigator.getGamepads.proxyGamepad(e.gamepad);
    window.dispatchEvent(event);
  });
}
