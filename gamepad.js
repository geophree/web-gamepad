import './thumbstick.js';
import './button_cluster.js';

export class GamepadInput extends HTMLElement {
  $thumbstickInputs;
  $buttonsInput;
  pauseEvents = false;
  sendEventAfterPause = false;
  _value = {
    index: 0,
    connected: false,
    timestamp: 0,
    buttons: [],
    axes: []
  };

  get value() {
    return this._value;
  }

  set value(gamepad) {
    const me = this;
    const { index, connected, timestamp, buttons, axes } = gamepad;
    me._withEventsPaused(() => {
      let changed = false;
      if (['string', 'number'].includes(typeof index)) {
        const numIndex = Number(index);
        if (numIndex >= 0 && Number.isSafeInteger(numIndex)) {
          changed ||= me._value.index !== numIndex;
          me._value.index = numIndex;
        }
      }

      if (connected === true || connected === false) {
        changed ||= me._value.connected !== connected;
        me._value.connected = connected;
      }

      if (['string', 'number'].includes(typeof timestamp)) {
        const numTimestamp = Number(timestamp);
        if (numTimestamp >= 0) {
          changed ||= me._value.timestamp !== numTimestamp;
          me._value.timestamp = numTimestamp;
        }
      }

      if (buttons?.length > 0) {
        const el = me.$buttonsInput;
        el.value = buttons.map(b => b.value);
      }

      if (axes?.length > 0) {
        me.$thumbstickInputs.forEach((el, i) => {
          const offset = 2 * i;
          el.value = axes.slice(offset, offset + 2);
        });
      }

      if (changed) me._dispatchInputEvent();
    });
  }

  _withEventsPaused(func) {
    this.pauseEvents = true;
    func();
    this.pauseEvents = false;
    if (this.sendEventAfterPause) {
      this.sendEventAfterPause = false;
      this._dispatchInputEvent();
    }
  }

  _dispatchInputEvent() {
    if (this.pauseEvents) {
      this.sendEventAfterPause = true;
      return;
    }

    this.dispatchEvent(new InputEvent('input'));
  }

  _updateButtons(offset, newButtons) {
    const { buttons } = this._value;
    let changed = false;
    newButtons.forEach((value, i) => {
      const b = buttons[i + offset];
      const pressed = value > 0;
      changed ||= b.pressed != pressed;
      b.pressed = pressed;
      changed ||= b.touched != pressed;
      b.touched = pressed;
      changed ||= b.value != value;
      b.value = value;
    });
    return changed;
  }

  _updateAxes(offset, newAxes) {
    const { axes } = this._value;
    let changed = false;
    newAxes.forEach((value, i) => {
      const index = i + 2 * offset;
      changed ||= axes[index] != value;
      axes[index] = value;
    });
    return changed;
  }

  constructor() {
    super();
    const me = this;
    me.attachShadow({ mode: 'open' });
    const root = me.shadowRoot;
    root.appendChild(template.content.cloneNode(true));
    me.$buttonsInput = root.querySelector('button-cluster-input');
    me.$thumbstickInputs = root.querySelectorAll('thumbstick-input');

    // TODO: allow for different configurations
    // TODO: rumble?

    // TODO: deal with more than 4 buttons
    if (me.$buttonsInput) {
      me._value.buttons = Array.from({ length: 4 }, () => ({
        pressed: false,
        touched: false,
        value: 0
      }));
      const update = (e) => {
        e.stopPropagation();
        if (!me._updateButtons(0, e.target.value)) return;
        this._dispatchInputEvent();

        me._value.connected = true;
        me._value.timestamp = performance.now();
      };

      me.$buttonsInput.addEventListener('input', update);
    }

    // TODO: DPAD emulation?
    const thumbstickCount = me.$thumbstickInputs.length;
    if (thumbstickCount) {
      me._value.axes = Array(thumbstickCount * 2).fill(0);
      me.$thumbstickInputs.forEach((el, offset) => {
        const update = (e) => {
          e.stopPropagation();
          if (!me._updateAxes(offset, e.target.value)) return;
          this._dispatchInputEvent();

          me._value.connected = true;
          me._value.timestamp = performance.now();
        };

        el.addEventListener('input', update);
      });
    }

    //TODO: do I need this?: this._dispatchInputEvent();
  }
}

const template = document.createElement('template');
template.innerHTML = `
<style>
div {
  display: flex;
}
div > * {
  flex: 1;
}
</style>
<div>
  <thumbstick-input></thumbstick-input>
  <button-cluster-input></button-cluster-input>
</div>
`;

window.customElements.define('gamepad-input', GamepadInput);

// The indexes for buttons/axes of the "standard" gamepad:
// https://w3c.github.io/gamepad/#remapping
const BUTTONS = [
  'SOUTH', // xbox A, ps X, nintendo B
  'EAST', // xbox B, ps O, nintendo A
  'WEST', // xbox X, ps square, nintendo Y
  'NORTH', // xbox Y, ps triangle, nintendo X
  'LEFT_BUMPER',
  'RIGHT_BUMPER',
  'LEFT_TRIGGER',
  'RIGHT_TRIGGER',
  'SELECT',
  'START',
  'LEFT_STICK',
  'RIGHT_STICK',
  'DPAD_UP',
  'DPAD_DOWN',
  'DPAD_LEFT',
  'DPAD_RIGHT',
  'HOME'
];

BUTTONS.forEach((e, i) => {
  BUTTONS[e] = i;
});

const AXES = [
  'LEFT_X',
  'LEFT_Y',
  'RIGHT_X',
  'RIGHT_Y'
];

AXES.forEach((e, i) => {
  AXES[e] = i;
});
