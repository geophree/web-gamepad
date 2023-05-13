const WRAPPED = Symbol('WRAPPED');

const proxies = [];
export const Gamepads = {
  win: null,
  registrants: [],
  proxies,
  map: [],

  attach(win) {
    // TODO: return if getGamepads is already WRAPPED?
    const nativeTarget = new EventTarget();
    for (const type of ["gamepadconnected", "gamepaddisconnected"]) {
      win.addEventListener(type, (e) => {
        const { gamepad } = e;
        if (gamepad[WRAPPED]) return;

        e.stopImmediatePropagation();
        const event = new Event(type);
        event.gamepad = gamepad;
        nativeTarget.dispatchEvent(event);
      });
    }

    Gamepads.win = win;
    const { navigator } = win;
    Gamepads.register(nativeTarget, navigator.getGamepads.bind(navigator));
    navigator.getGamepads = this.getGamepads.bind(this);
    navigator.getGamepads[WRAPPED] = true;
  },

  register(target, getGamepads) {
    const me = this;
    let cached;
    const getGamepad = (index) => {
      if (!cached) {
        cached = getGamepads();
        setTimeout(() => cached = undefined);
      }
      return cached[index];
    }
    const outerIndex = this.registrants.length;
    const registrant = { index: outerIndex, target, getGamepad, map: [] };
    this.registrants.push(registrant);

    for (const type of ["gamepadconnected", "gamepaddisconnected"]) {
      target.addEventListener(type, (e) => {
        let { gamepad } = e;
        let index = registrant.map[gamepad.index];
        if (index == null) {
          index = proxies.length;
          registrant.map[gamepad.index] = index;
          me.map[index] = [outerIndex, gamepad.index];
        }
        gamepad = proxies[index];
        if (gamepad == null) {
          gamepad = me.proxyGamepad(index);
          proxies[index] = gamepad;
        }
        const event = new Event(type);
        event.gamepad = gamepad;
        me.win.dispatchEvent(event);
      })
    }

    target.addEventListener("gamepaddisconnected", (e) => {
      let { gamepad } = e;
      let index = registrant.map[gamepad.index];
      setTimeout(() => me.proxies[index] = null);
    })
  },

  proxyGamepad(index) {
    const me = this;
    return new Proxy({}, {
      set: () => false,
      get(target, prop, receiver) {
        if (prop === WRAPPED) return true;
        if (prop === "index") return index;
        const [outerIndex, innerIndex] = me.map[index];
        target = me.registrants[outerIndex].getGamepad(innerIndex);
        return target?.[prop];
      },
      has(target, prop) {
        if (prop === WRAPPED) return true;
        const [outerIndex, innerIndex] = me.map[index];
        target = me.registrants[outerIndex].getGamepad(innerIndex);
        return prop in target;
      }
    });
  },

  gamepads: new Proxy(proxies, {
    set: () => false,
    get: (target, prop, receiver) => (prop === WRAPPED) ? true : target[prop],
    has: (target, prop) => prop === WRAPPED || prop in target,
  }),

  getGamepads() {
    return this.gamepads;
  }
};

Gamepads.attach(window);
